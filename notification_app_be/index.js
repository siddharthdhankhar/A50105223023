
const { Log } = require('../logging_middleware');

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzaWRkaGFydGg4QHMuYW1pdHkuZWR1IiwiZXhwIjoxNzgwMDQwMjA4LCJpYXQiOjE3ODAwMzkzMDgsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiMWVkN2MwOS0yZGUzLTQ3YTYtOGVjZS00ZTMwY2U0MTZkOWUiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJzaWRkaGFydGgiLCJzdWIiOiJiZjczYTNhNC0zZWM1LTRjOGQtODIwZS0xMDM0YmNiYmE3MGUifSwiZW1haWwiOiJzaWRkaGFydGg4QHMuYW1pdHkuZWR1IiwibmFtZSI6InNpZGRoYXJ0aCIsInJvbGxObyI6ImE1MDEwNTIyMzAyMyIsImFjY2Vzc0NvZGUiOiJKR0pzVVQiLCJjbGllbnRJRCI6ImJmNzNhM2E0LTNlYzUtNGM4ZC04MjBlLTEwMzRiY2JiYTcwZSIsImNsaWVudFNlY3JldCI6ImdzVXVlUFZ0V2h1Zlp3UnEifQ.LY0QIJEU1NrAyM3ZsIeexkeyeanFRHMTOVbC0N5BpY0";
const API_URL = "http://4.224.186.213/evaluation-service/notifications";

const PRIORITY_WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

function getTop10PriorityNotifications(notifications) {
    return notifications.sort((a, b) => {
        const weightA = PRIORITY_WEIGHTS[a.Type] || 0;
        const weightB = PRIORITY_WEIGHTS[b.Type] || 0;

        if (weightA !== weightB) {
            return weightB - weightA;
        }

        const timeA = new Date(a.Timestamp).getTime();
        const timeB = new Date(b.Timestamp).getTime();
        return timeB - timeA;

    }).slice(0, 10);
}

async function fetchAndSortNotifications() {

    await Log("backend", "info", "handler", "Init Stage 6 Priority Fetch");

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            await Log("backend", "error", "handler", `API Fetch failed: ${response.status}`);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.notifications || !Array.isArray(data.notifications)) {
            throw new Error("Invalid payload format from Server");
        }

        await Log("backend", "info", "handler", "Successfully fetched target data");

        const top10 = getTop10PriorityNotifications(data.notifications);

        console.log("\n==========================================");
        console.log("🏆 TOP 10 PRIORITY INBOX NOTIFICATIONS");
        console.log("==========================================\n");
        
        top10.forEach((notif, index) => {
            console.log(`${index + 1}. [${notif.Type.toUpperCase()}] - ${notif.Timestamp}`);
            console.log(`   Message: ${notif.Message}`);
            console.log(`   ID: ${notif.ID}\n`);
        });

        await Log("backend", "info", "handler", "Displayed Top 10 notifications");

    } catch (error) {
        console.error("❌ Execution Failed:", error.message);
        await Log("backend", "fatal", "handler", "Critical failure in Stage 6");
    }
}

fetchAndSortNotifications();