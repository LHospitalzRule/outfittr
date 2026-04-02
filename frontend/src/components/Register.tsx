import React, { useState } from 'react';
import { buildPath } from './Path';

function Register() {
    const [message, setMessage] = useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [registerLogin, setRegisterLogin] = React.useState('');
    const [registerPassword, setRegisterPassword] = React.useState('');

    async function doRegister(event: any): Promise<void> {
        event.preventDefault();
        var obj = { firstName, lastName, login: registerLogin, password: registerPassword };
        var js = JSON.stringify(obj);
        try {
            const response = await fetch(buildPath('api/register'),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });
            var res = JSON.parse(await response.text());
            if (res.error && res.error.length > 0) {
                setMessage('Registration error: ' + res.error);
            } else {
                setMessage('Registration successful! You may now log in.');
            }
        } catch (error: any) {
            setMessage(error.toString());
        }
    };

    return (
        <div id="registerDiv">
            <input
                type="text"
                placeholder="First Name"
                onChange={e => setFirstName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Last Name"
                onChange={e => setLastName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Username"
                onChange={e => setRegisterLogin(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                onChange={e => setRegisterPassword(e.target.value)}
            />
            <button type="button" onClick={doRegister}>CREATE ACCOUNT</button>
            {message && <span id="registerResult">{message}</span>}
        </div>
    );
}

export default Register;