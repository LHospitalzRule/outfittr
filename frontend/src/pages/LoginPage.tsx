import React, { useState } from 'react';
import Login from '../components/Login';
import Register from '../components/Register';

type CardMode = 'none' | 'login' | 'register';

const LoginPage = () => {
    const [mode, setMode] = useState<CardMode>('none');
    const overlay = mode !== 'none';

    return (
        <div style={styles.root}>

            {/* ── Background graffiti image ── */}
            <img src="/landing.png" alt="OutFittr" style={styles.bg} />

            {/* ── Navbar ── */}
            <nav style={styles.nav}>
                <div style={styles.navLinks}>
                    <span style={{ ...styles.navItem, ...styles.navActive }}>HOME</span>
                    <span style={styles.navItem}>CRAFT</span>
                    <span style={styles.navItem}>CATALOG</span>
                </div>
                <div style={styles.avatar} title="Profile" />
            </nav>

            {/* ── Login / Register tag buttons ── */}
            {!overlay && (
                <div style={styles.tagStack}>
                    <button style={styles.tagBtn} onClick={() => setMode('login')}>
                        LOGIN
                    </button>
                    <button style={styles.tagBtn} onClick={() => setMode('register')}>
                        REGISTER
                    </button>
                </div>
            )}

            {/* ── Bottom-left text panel ── */}
            <div style={styles.textPanel}>
                <p style={styles.textPanelBody}>
                    Lorem ipsum is simply dummy text of the printing and typesetting industry.
                    Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
                    when an unknown printer took a galley of type and scrambled it to make a type
                    specimen book.
                </p>
            </div>

            {/* ── Bottom-right product arrow ── */}
            <div style={styles.productPanel}>
                <div style={styles.productArrow}>→</div>
            </div>

            {/* ── Backdrop ── */}
            {overlay && (
                <div style={styles.backdrop} onClick={() => setMode('none')} />
            )}

            {/* ── Login card ── */}
            {mode === 'login' && (
                <div style={styles.card}>
                    <button style={styles.closeBtn} onClick={() => setMode('none')}>✕</button>
                    <p style={styles.cardEyebrow}>WELCOME BACK</p>
                    <h2 style={styles.cardTitle}>OUTFITTR</h2>
                    <div style={styles.formWrapper}>
                        <Login />
                    </div>
                    <p style={styles.switchText}>
                        No account?{' '}
                        <span style={styles.switchLink} onClick={() => setMode('register')}>
                            Register here
                        </span>
                    </p>
                </div>
            )}

            {/* ── Register card ── */}
            {mode === 'register' && (
                <div style={styles.card}>
                    <button style={styles.closeBtn} onClick={() => setMode('none')}>✕</button>
                    <p style={styles.cardEyebrow}>JOIN THE MOVEMENT</p>
                    <h2 style={styles.cardTitle}>OUTFITTR</h2>
                    <div style={styles.formWrapper}>
                        <Register />
                    </div>
                    <p style={styles.switchText}>
                        Already have an account?{' '}
                        <span style={styles.switchLink} onClick={() => setMode('login')}>
                            Log in
                        </span>
                    </p>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
                * { box-sizing: border-box; }

                #loginDiv, #registerDiv {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                #loginDiv input,
                #registerDiv input {
                    background: #0f0f0f;
                    border: 1px solid #2a2a2a;
                    border-radius: 3px;
                    color: #F5F0E8;
                    font-family: 'Bebas Neue', Impact, sans-serif;
                    font-size: 15px;
                    letter-spacing: 1.5px;
                    padding: 11px 14px;
                    outline: none;
                    transition: border-color 0.2s;
                    width: 100%;
                }
                #loginDiv input::placeholder,
                #registerDiv input::placeholder {
                    color: #444;
                    font-family: 'Bebas Neue', Impact, sans-serif;
                    letter-spacing: 1.5px;
                }
                #loginDiv input:focus,
                #registerDiv input:focus {
                    border-color: #E8D20A;
                }
                #loginDiv input[type="submit"],
                #loginDiv button[type="button"],
                #registerDiv button[type="button"] {
                    background: #E8D20A;
                    border: none;
                    border-radius: 3px;
                    color: #0A0A0A;
                    cursor: pointer;
                    font-family: 'Bebas Neue', Impact, sans-serif;
                    font-size: 18px;
                    letter-spacing: 3px;
                    padding: 12px;
                    margin-top: 6px;
                    transition: background 0.15s, transform 0.1s;
                    width: 100%;
                }
                #loginDiv input[type="submit"]:hover,
                #loginDiv button[type="button"]:hover,
                #registerDiv button[type="button"]:hover {
                    background: #D4145A;
                    color: #F5F0E8;
                    transform: scale(1.02);
                }
                #loginResult, #registerResult {
                    color: #D4145A;
                    font-family: 'Bebas Neue', Impact, sans-serif;
                    font-size: 13px;
                    letter-spacing: 1px;
                    text-align: center;
                    margin-top: 4px;
                }
                #inner-title { display: none; }

                .outfittr-tag-btn:hover {
                    background: #E8D20A !important;
                    color: #0A0A0A !important;
                    transform: scale(1.05);
                }
                .outfittr-nav-item:hover {
                    color: #E8D20A !important;
                }
                .outfittr-close-btn:hover {
                    color: #E8D20A !important;
                }
                .outfittr-avatar:hover {
                    border-color: #E8D20A !important;
                }
            `}</style>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    root: {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        background: '#0A0A0A',
    },
    bg: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        zIndex: 0,
    },

    /* Navbar */
    nav: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10,
    },
    navLinks: {
        display: 'flex',
        alignItems: 'center',
        gap: '0px',
    },
    navItem: {
        color: '#F5F0E8',
        cursor: 'pointer',
        fontSize: '16px',
        letterSpacing: '2px',
        padding: '6px 22px',
        transition: 'color 0.15s',
    },
    navActive: {
        background: '#F5F0E8',
        color: '#0A0A0A',
        borderRadius: '2px',
    },
    avatar: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: '#CFCBC3',
        cursor: 'pointer',
        border: '2px solid #333',
        flexShrink: 0,
        transition: 'border-color 0.2s',
    },

    /* Center tag buttons */
    tagStack: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        zIndex: 5,
    },
    tagBtn: {
        background: '#0A0A0A',
        border: 'none',
        borderRadius: '4px',
        color: '#F5F0E8',
        cursor: 'pointer',
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: '22px',
        letterSpacing: '5px',
        minWidth: '170px',
        padding: '10px 30px',
        textAlign: 'center',
        transition: 'background 0.15s, color 0.15s, transform 0.15s',
    },

    /* Bottom-left text panel */
    textPanel: {
        position: 'absolute',
        bottom: '24px',
        left: '20px',
        width: '210px',
        background: 'rgba(0,0,0,0.65)',
        padding: '14px 16px',
        zIndex: 5,
        borderLeft: '3px solid #E8D20A',
    },
    textPanelBody: {
        color: '#F5F0E8',
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 400,
        lineHeight: 1.65,
        margin: 0,
        letterSpacing: '0.2px',
    },

    /* Bottom-right arrow */
    productPanel: {
        position: 'absolute',
        bottom: '28px',
        right: '24px',
        zIndex: 5,
    },
    productArrow: {
        alignItems: 'center',
        background: '#0A0A0A',
        borderRadius: '50%',
        color: '#F5F0E8',
        cursor: 'pointer',
        display: 'flex',
        fontSize: '20px',
        height: '42px',
        justifyContent: 'center',
        width: '42px',
        transition: 'background 0.15s',
    },

    /* Backdrop */
    backdrop: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 15,
        cursor: 'pointer',
    },

    /* Popup card */
    card: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        background: '#111',
        border: '1px solid #222',
        borderTop: '3px solid #E8D20A',
        borderRadius: '4px',
        padding: '40px 36px 32px',
        width: '100%',
        maxWidth: '380px',
    },
    closeBtn: {
        position: 'absolute' as const,
        top: '12px',
        right: '14px',
        background: 'transparent',
        border: 'none',
        color: '#444',
        cursor: 'pointer',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        padding: '4px 6px',
        transition: 'color 0.15s',
    },
    cardEyebrow: {
        color: '#D4145A',
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: '11px',
        letterSpacing: '3px',
        margin: '0 0 4px',
    },
    cardTitle: {
        color: '#F5F0E8',
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: '38px',
        fontWeight: 400,
        letterSpacing: '7px',
        margin: '0 0 28px',
    },
    formWrapper: {
        width: '100%',
    },
    switchText: {
        color: '#555',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        letterSpacing: '0.3px',
        marginTop: '18px',
        textAlign: 'center',
    },
    switchLink: {
        color: '#E8D20A',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
};

export default LoginPage;