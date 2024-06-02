// components/Modal.js
import React from 'react';

const Modal = ({ show, children, onClose }) => {
    if (!show) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            zIndex: 1000
        }}>
            {children}
            <div style={{ marginTop: '10px' }}>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default Modal;
