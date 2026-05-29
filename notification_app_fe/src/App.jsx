import React, { useState, useEffect } from 'react';
import 'logging_middleware';
const Log = window.Log;
import { Container, Grid, Card, CardContent, Typography, Chip, Select, MenuItem, FormControl, InputLabel, Box, AppBar, Toolbar, Badge, Button } from '@mui/material';

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzaWRkaGFydGg4QHMuYW1pdHkuZWR1IiwiZXhwIjoxNzgwMDQwMjA4LCJpYXQiOjE3ODAwMzkzMDgsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiMWVkN2MwOS0yZGUzLTQ3YTYtOGVjZS00ZTMwY2U0MTZkOWUiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJzaWRkaGFydGgiLCJzdWIiOiJiZjczYTNhNC0zZWM1LTRjOGQtODIwZS0xMDM0YmNiYmE3MGUifSwiZW1haWwiOiJzaWRkaGFydGg4QHMuYW1pdHkuZWR1IiwibmFtZSI6InNpZGRoYXJ0aCIsInJvbGxObyI6ImE1MDEwNTIyMzAyMyIsImFjY2Vzc0NvZGUiOiJKR0pzVVQiLCJjbGllbnRJRCI6ImJmNzNhM2E0LTNlYzUtNGM4ZC04MjBlLTEwMzRiY2JiYTcwZSIsImNsaWVudFNlY3JldCI6ImdzVXVlUFZ0V2h1Zlp3UnEifQ.LY0QIJEU1NrAyM3ZsIeexkeyeanFRHMTOVbC0N5BpY0";
const API_URL = "/evaluation-service/notifications";

const PRIORITY_WEIGHTS = { "Placement": 3, "Result": 2, "Event": 1 };

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const [limit, setLimit] = useState(10);
  const [filterType, setFilterType] = useState('All');
  
  const [readIds, setReadIds] = useState(() => {
    return JSON.parse(localStorage.getItem('readNotifications')) || [];
  });

  const fetchNotifications = async () => {
    try {
      await Log("frontend", "info", "api", "Fetching notifications");
      
      let url = new URL(API_URL, window.location.origin);
      if (filterType !== 'All') url.searchParams.append('notification_type', filterType);
      url.searchParams.append('limit', limit);

      const response = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
      });
      
      const data = await response.json();
    
      if (!data.notifications || !Array.isArray(data.notifications)) {
        console.error("API did not return notifications. Token might be expired.", data);
        return; 
      }
      
      const sorted = data.notifications.sort((a, b) => {
        const weightA = PRIORITY_WEIGHTS[a.Type] || 0;
        const weightB = PRIORITY_WEIGHTS[b.Type] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
      });

      setNotifications(sorted);
      await Log("frontend", "info", "state", "UI Updated");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [limit, filterType]);

  const markAsRead = async (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem('readNotifications', JSON.stringify(updated));
      await Log("frontend", "info", "component", `Marked read`);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f4f6f8', minHeight: '100vh', pb: 5 }}>
      <AppBar position="static" color="primary" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Affordmed Campus Portal
          </Typography>
          <Badge badgeContent={notifications.filter(n => !readIds.includes(n.ID)).length} color="error">
            <Typography variant="button">Unread</Typography>
          </Badge>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 150, bgcolor: 'white' }}>
            <InputLabel>Priority Limit</InputLabel>
            <Select value={limit} label="Priority Limit" onChange={(e) => setLimit(e.target.value)}>
              <MenuItem value={5}>Top 5</MenuItem>
              <MenuItem value={10}>Top 10</MenuItem>
              <MenuItem value={20}>Top 20</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150, bgcolor: 'white' }}>
            <InputLabel>Filter Type</InputLabel>
            <Select value={filterType} label="Filter Type" onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="Placement">Placement</MenuItem>
              <MenuItem value="Result">Result</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {notifications.length === 0 ? (
           <Typography variant="h6" color="text.secondary" align="center">
             No notifications found or token expired. Check console.
           </Typography>
        ) : (
          <Grid container spacing={3}>
            {notifications.map((notif) => {
              const isRead = readIds.includes(notif.ID);
              return (
                <Grid item xs={12} key={notif.ID}>
                  <Card 
                    elevation={isRead ? 1 : 4} 
                    sx={{ 
                      bgcolor: isRead ? '#ffffff' : '#e3f2fd',
                      borderLeft: isRead ? '4px solid #bdbdbd' : '4px solid #1976d2',
                      transition: '0.3s'
                    }}
                  >
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip 
                            label={notif.Type.toUpperCase()} 
                            size="small" 
                            color={notif.Type === 'Placement' ? 'success' : notif.Type === 'Result' ? 'warning' : 'default'} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notif.Timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: isRead ? 'normal' : 'bold' }}>
                          {notif.Message}
                        </Typography>
                      </Box>
                      {!isRead && (
                        <Button variant="outlined" size="small" onClick={() => markAsRead(notif.ID)}>
                          Mark Read
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}