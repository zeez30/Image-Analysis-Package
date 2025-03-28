const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const router = express.router();

//Login
router.post('/login', async (req, res) => {
    let {username, password, email} = req.body;
    email = email.trim();
    password = password.trim();
    username = username.trim();

    if(email == "" || password == "" || username == "") {
        return res.status(400).json({error: 'No credentials, please input your account credentials'});
    }
})

router.post('/signup', async (req, res) => {
    let {username, password, dateOfBirth, email} = req.body;
    username = username.trim();
    email = email.trim();
    password = password.trim();
    dateOfBirth = dateOfBirth.trim();

    const newUser = {
        username,
        password,
        dateOfBirth,
        email,
    };

    users.push(newUser);
    res.status(200).json(newUser);

    if (username == "" || email == "" || password == "" || dateOfBirth == "" || password == "" ) {
        res.json({
            status: "error",
            message: "Empty field user invalid"
        });
    }
    //Check if there are other users with the same username
    const existingUser = users.find(user => user.username === username);
    if (!existingUser) {
        return res.status(400).json({error: 'User already exists'});
    }
    //Validation of username and password
    if (!username || !password) {
        return res.status(400).json({error: 'Please enter username and password'});
    }
    //Validation of email
    if (!/S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({error: 'Invalid email'});
    }
    //Check for already existing email that is already registered
    const existingEmail = users.find(user => user.email === email);
    if (!existingEmail) {
        return res.status(400).json({error: 'Email already exists'});
    }
    //Validation for date of birth
    if (!new Date(dateOfBirth).getTime()) {
        res.json({
            status: "error",
            message: "Invalid date of birth"
        })
    }
})