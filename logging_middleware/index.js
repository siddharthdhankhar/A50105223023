
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzaWRkaGFydGg4QHMuYW1pdHkuZWR1IiwiZXhwIjoxNzgwMDQwMjA4LCJpYXQiOjE3ODAwMzkzMDgsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiMWVkN2MwOS0yZGUzLTQ3YTYtOGVjZS00ZTMwY2U0MTZkOWUiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJzaWRkaGFydGgiLCJzdWIiOiJiZjczYTNhNC0zZWM1LTRjOGQtODIwZS0xMDM0YmNiYmE3MGUifSwiZW1haWwiOiJzaWRkaGFydGg4QHMuYW1pdHkuZWR1IiwibmFtZSI6InNpZGRoYXJ0aCIsInJvbGxObyI6ImE1MDEwNTIyMzAyMyIsImFjY2Vzc0NvZGUiOiJKR0pzVVQiLCJjbGllbnRJRCI6ImJmNzNhM2E0LTNlYzUtNGM4ZC04MjBlLTEwMzRiY2JiYTcwZSIsImNsaWVudFNlY3JldCI6ImdzVXVlUFZ0V2h1Zlp3UnEifQ.LY0QIJEU1NrAyM3ZsIeexkeyeanFRHMTOVbC0N5BpY0";
const API_URL = "http://4.224.186.213/evaluation-service/notifications";

async function Log(stack, level, pkgName, message) {
    if (!TOKEN || TOKEN === "YOUR_ACCESS_TOKEN_HERE") {
        console.warn("Log Middleware: No token found. Please add your token.");
        return; 
    }

    const url = typeof window !== 'undefined' ? '/evaluation-service/logs' : 'http://4.224.186.213/evaluation-service/logs';

    const payload = {
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: pkgName.toLowerCase(),
        message: message
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`Log API Failed [${response.status}]:`, err);
        }
    } catch (error) {
        console.error("Log API Exception:", error);
    }
}

// Universal Export for both Node.js and React
if (typeof module !== 'undefined') {
    module.exports = { Log };
}
if (typeof window !== 'undefined') {
    window.Log = Log;
}