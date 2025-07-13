import './modal.css';

const Modal = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="modal-background">
      <div className="modal-content">{children}</div>
    </div>
  );
};

export default Modal;
