// components/Modal.js
import React from 'react';

const Modal = ({children}) => {
    return (
        <div className="modal-background">
            <div className="modal-content">
                {children}
            </div>
        </div>
    );
};

export default Modal;
