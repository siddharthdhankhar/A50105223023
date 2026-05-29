# Notification Platform System Design

---

# Stage 1: REST API Design

To support a robust notification platform, the REST API needs to be predictable and stateless.

## Core Endpoints

### 1. Fetch Notifications

**Endpoint:** `GET /api/v1/notifications`

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
```http
?limit=10&page=1&isRead=false
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "Placement",
      "message": "CSX Corporation hiring",
      "isRead": false,
      "timestamp": "2026-04-22T17:51:18Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5
  }
}
```

### 2. Mark Notification as Read

**Endpoint:** `PATCH /api/v1/notifications/:id/read`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Notification marked as read successfully"
}
```

## Real-Time Mechanism

For real-time updates without overwhelming the server, I recommend **Server-Sent Events (SSE)**. Unlike WebSockets (which are bi-directional and heavier), notifications are generally a one-way stream (Server → Client). SSE operates over standard HTTP, making it easier to load balance and manage securely.

---

# Stage 2: Database Choice & Schema

## Database Choice: PostgreSQL (Relational Database)

### Why PostgreSQL?

Notifications have a strict schema (user, type, status, timestamp) and require structured querying (e.g., filtering by read status or date). ACID compliance ensures critical placement alerts are not lost.

## Schema & Scale Solutions

As data volume increases, the table will bloat, slowing down read queries and increasing index sizes.

**Solution:** Implement table partitioning by date (e.g., monthly partitions), since users rarely check notifications older than a few weeks. Older partitions can be moved to cold storage.

### SQL Schema

```sql
-- 1. Create the Enum Type
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

-- 2. Create the Master Table (Partitioned by created_at)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 3. Create Monthly Partitions (Example)
CREATE TABLE notifications_y2026m04 PARTITION OF notifications
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

---

# Stage 3: Query Optimization

## Analysis of the Slow Query

The original query is slow because it likely requires a full table scan if no indexes exist. As the table grows to millions of rows, scanning every row for a specific student and read status becomes highly inefficient.

### Is Adding Indexes on Every Column Effective?

**No.** Over-indexing increases storage costs and significantly slows down write operations (`INSERT` / `UPDATE`), since every index must be updated whenever a new notification is created.

## The Fix

Add a **Composite Index** on:

```text
(studentID, isRead, createdAt)
```

This allows the database to instantly locate a student's unread notifications while maintaining sorted order, reducing lookup complexity from approximately **O(N)** to **O(log N)**.

### Query for Placement Notifications in the Last 7 Days

```sql
SELECT *
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

---

# Stage 4: Performance Under Load

Fetching notifications directly from the database on every page load creates a major bottleneck.

## Solutions & Trade-Offs

### 1. Caching Layer (Redis)

Cache the unread count and the top 10 most recent notifications for active users in Redis.

**Trade-Off:**

Cache invalidation becomes more complex because the cache must stay synchronized whenever notifications are created or marked as read.

### 2. Pagination / Cursor-Based Fetching

Instead of loading all notifications, load only the first 10 and fetch additional records as the user scrolls.

**Trade-Off:**

Cursor pagination offers better performance at scale but is slightly more complex to implement on the frontend than offset pagination.

---

# Stage 5: Architecture & Reliability

## Shortcomings of the Existing Pseudocode

The current implementation is entirely synchronous. If the `send_email()` API times out or fails (as it did for the 200 students), the script may crash or hang.

As a result:

- Database inserts may stop.
- Real-time pushes may fail for remaining users.
- System reliability decreases.

Additionally, saving to the database and sending emails should not be tightly coupled in a synchronous loop because email delivery is slow and prone to network failures.

## Redesign Strategy

Use an asynchronous **Message Queue** such as:

- RabbitMQ
- AWS SQS

The main process should:

1. Save notifications to the database.
2. Push events into a queue.

Background workers then process email delivery independently and apply retry logic when failures occur.

### Revised Pseudocode

```python
function notify_all(student_ids: array, message: string):

    # 1. Bulk insert to DB for speed
    bulk_save_to_db(student_ids, message)

    # 2. Push to real-time service and queue
    for student_id in student_ids:
        push_to_app(student_id, message)
        enqueue_email_task(student_id, message)


# Background Worker (Runs independently)
function process_email_queue():
    while task = queue.pop():
        try:
            send_email(task.student_id, task.message)
        except EmailServiceError:
            queue.retry(task, delay=5mins)
```

---

# Stage 6: Priority Sorting Approach

## Maintaining the Top 10 Notifications Efficiently

To handle incoming streams of notifications without re-sorting the entire dataset whenever a new notification arrives, the most efficient approach is a **Min-Heap (Priority Queue)** limited to a size of 10.

### Working Principle

1. Calculate the priority score of the incoming notification.
2. Compare it with the root element of the Min-Heap.
3. If the new notification has a higher priority:
   - Remove the root.
   - Insert the new notification.

This keeps only the top 10 highest-priority notifications at all times.

### Time Complexity

```text
O(log k)
```

where:

```text
k = 10
```

This is significantly more efficient than performing a complete sort:

```text
O(N log N)
```

for every incoming notification.
