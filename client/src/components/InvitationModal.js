import React from 'react';
import './InvitationModal.css';

function InvitationModal({ invitation, onAccept, onReject }) {
  // 如果没有邀请信息，就不渲染任何东西
  if (!invitation) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="invitation-modal">
        <div className="modal-header">Focus Invitation</div>
        <div className="modal-body">
          <strong>{invitation.fromNickname}</strong> wants to start a {invitation.duration} min co-focus session with you!
        </div>
        <div className="modal-actions">
          <button className="accept-btn" onClick={onAccept}>Accept</button>
          <button className="reject-btn" onClick={onReject}>Reject</button>
        </div>
      </div>
    </div>
  );
}

export default InvitationModal;