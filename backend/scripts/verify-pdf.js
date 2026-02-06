
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000';

async function run() {
    try {
        // Login User
        console.log("Logging in as User...");
        // Assuming user exists from previous runs or we register a new one
        const userEmail = `userPdf${Date.now()}@test.com`;
        await axios.post(`${API_URL}/auth/register`, {
            email: userEmail,
            username: 'PDF User',
            password: 'password123',
            confirmPassword: 'password123'
        });

        let res = await axios.post(`${API_URL}/auth/login`, {
            email: userEmail,
            password: 'password123'
        });
        const userToken = res.data.accessToken;

        // Login Admin to create event
        console.log("Logging in as Admin...");
        res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ticketa.com',
            password: 'adminpassword'
        });
        const adminToken = res.data.accessToken;

        // Create Event
        console.log("Creating Event...");
        const eventData = {
            title: "PDF Event",
            description: "Testing PDF",
            date: new Date().toISOString(),
            location: "Online",
            totalTickets: 10,
            price: 50
        };
        res = await axios.post(`${API_URL}/events`, eventData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const eventId = res.data._id;
        await axios.patch(`${API_URL}/events/${eventId}/publish`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        // Make Reservation
        console.log("Making Reservation...");
        res = await axios.post(`${API_URL}/reservations`, { eventId }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const reservationId = res.data._id;
        console.log("Reservation ID:", reservationId);

        // Download PDF
        console.log("Downloading PDF...");
        const pdfResponse = await axios.get(`${API_URL}/reservations/${reservationId}/pdf`, {
            headers: { Authorization: `Bearer ${userToken}` },
            responseType: 'stream'
        });

        const installPath = path.resolve(__dirname, 'ticket-test.pdf');
        const writer = fs.createWriteStream(installPath);

        pdfResponse.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log("PDF Downloaded successfully to:", installPath);
                // Check file size > 0
                const stats = fs.statSync(installPath);
                if (stats.size > 0) {
                    console.log("SUCCESS: PDF file is not empty (Size: " + stats.size + " bytes).");
                    resolve();
                } else {
                    console.error("FAILURE: PDF file is empty.");
                    reject(new Error("Empty PDF"));
                }
            });
            writer.on('error', reject);
        });

    } catch (error) {
        console.error("Script Failed:", error.response ? error.response.data : error.message);
    }
}

run();
