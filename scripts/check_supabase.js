const https = require('https');

const url = "https://nbyljmuuxzljxsdbegqz.supabase.co/rest/v1/user_profile?select=*&limit=1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieWxqbXV1eHpsanN4ZGJlcWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODAxNzMsImV4cCI6MjA4NjA1NjE3M30.LHeqYSM4nGwqkRg77mEGWhO0d2O37Ro90n_y1h1iDCM";

const options = {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
};

https.get(url, options, (res) => {
    console.log('statusCode:', res.statusCode);

    let data = '';
    res.on('data', (d) => {
        data += d;
    });

    res.on('end', () => {
        console.log('Response:', data);
    });

}).on('error', (e) => {
    console.error('Error:', e);
});
