const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../../.env') });
const axios = require('axios');
const FormData = require('form-data');

const uploadFileToIPFS = async (file) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        let data = new FormData();
        data.append('file', fs.createReadStream(file.path));

        const res = await axios.post(url, data, {
            maxBodyLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
            }
        });
        return res.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading file to Pinata:", error);
        throw error;
    }
};

const uploadJSONToIPFS = async (JSONBody) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const res = await axios.post(url, JSONBody, {
            headers: {
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
            }
        });
        return res.data.IpfsHash;
    } catch (error) {
        console.error("Error uploading JSON to Pinata:", error);
        throw error;
    }
};

module.exports = {
    uploadFileToIPFS,
    uploadJSONToIPFS
};
