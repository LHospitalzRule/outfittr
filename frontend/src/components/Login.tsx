import React, { useState } from 'react';
import { buildPath } from './Path';
import { storeToken } from '../../tokenStorage'; // ✅ FIXED PATH
import { useNavigate } from 'react-router-dom';

function Login() {
    const [message, setMessage] = useState('');
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setPassword] = useState('');
    const navigate = useNavigate();

    async function doLogin(event: any): Promise<void> {
        event.preventDefault();

        const obj = { login: loginName, password: loginPassword };

        try {
            const response = await fetch(buildPath('api/login'), {
                method: 'POST',
                body: JSON.stringify(obj),
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();
            console.log(res);

            // ❗ Check token exists
            if (!res.accessToken) {
                setMessage('User/Password incorrect');
                return;
            }

            // Store token
            storeToken(res);

            // Decode JWT
            const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
            console.log(payload);

            const { userId, firstName, lastName } = payload;

            if (!userId) {
                setMessage('User/Password incorrect');
                return;
            }

            const user = { firstName, lastName, id: userId };
            localStorage.setItem('user_data', JSON.stringify(user));

            setMessage('');

            // ✅ USE REACT NAVIGATION
            navigate('/dashboard');

        } catch (error: any) {
            alert(error.toString());
        }
    }

    return (
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN</span><br />

            <input
                type="text"
                placeholder="Username"
                onChange={(e) => setLoginName(e.target.value)}
            /><br />

            <input
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
            /><br />

            <button onClick={doLogin}>
                Login
            </button>

            <span id="loginResult">{message}</span>
        </div>
    );
}

export default Login;
// import React, { useState } from 'react';
// import { buildPath } from './Path.ts';

// function Login() {

//     const [message, setMessage] = useState('');
//     const [loginName, setLoginName] = React.useState('');
//     const [loginPassword, setPassword] = React.useState('');

//     async function doLogin(event: any): Promise<void> {
//         event.preventDefault();
//         var obj = { login: loginName, password: loginPassword };
//         var js = JSON.stringify(obj);
//         try {
//             const response = await fetch(buildPath('api/login'),
//                 {
//                     method: 'POST', body: js, headers: {
//                         'Content-Type':
//                             'application/json'
//                     }
//                 });
//             var res = JSON.parse(await response.text());
//             if (res.id <= 0) {
//                 setMessage('User/Password combination incorrect');
//             }
//             else {
//                 var user =
//                     { firstName: res.firstName, lastName: res.lastName, id: res.id }
//                 localStorage.setItem('user_data', JSON.stringify(user));
//                 setMessage('');
//                 window.location.href = '/items';
//             }
//         }
//         catch (error: any) {
//             alert(error.toString());
//             return;
//         }
//     };

//     function handleSetLoginName(e: any): void {
//         setLoginName(e.target.value);
//     }
//     function handleSetPassword(e: any): void {
//         setPassword(e.target.value);
//     }

//     return (
//         <div id="loginDiv">
//             <span id="inner-title">PLEASE LOG IN</span><br />
//             <input type="text" id="loginName" placeholder="Username" onChange={handleSetLoginName} /><br />
//             <input type="password" id="loginPassword" placeholder="Password" onChange={handleSetPassword} />
//             <input type="submit" id="loginButton" className="buttons" value="Do It"
//                 onClick={doLogin} />
//             <span id="loginResult">{message}</span>
//         </div>
//     );
// };
// export default Login;