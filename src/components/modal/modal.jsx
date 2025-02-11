<<<<<<< HEAD
import './modal.css';
const Modal = ({ children }) => {
=======
// components/Modal.js
const Modal = ({children}) => {
>>>>>>> 6413ac6 (fixed the refreshed issue with isUserTurn in singlePlayer)
    return (
        <div className="modal-background">
            <div className="modal-content">
                {children}
            </div>
        </div>
    );
};

export default Modal;
