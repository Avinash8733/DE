import React, { useState, useRef, useEffect } from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";

export default function Contacts({ onAnnouncement }) {
  const { blindMode, announce, speak, listen, isSpeaking } = useAccessibility();
  const [contacts, setContacts] = useState([
    { id: 1, name: "John Smith", email: "john@example.com", phone: "+1-555-0123", notes: "Work colleague" },
    { id: 2, name: "Sarah Johnson", email: "sarah@email.com", phone: "+1-555-0456", notes: "Friend from college" },
    { id: 3, name: "Mike Wilson", email: "mike@company.com", phone: "+1-555-0789", notes: "Project manager" },
    { id: 4, name: "Lisa Brown", email: "lisa@business.org", phone: "+1-555-0321", notes: "Client contact" }
  ]);
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", notes: "" });
  
  useEffect(() => {
    // Load contacts from localStorage
    const savedContacts = localStorage.getItem('contacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }

    const handleReadList = () => readContactsList();
    const handleReadPage = () => announce(`You are in the contacts section. You have ${contacts.length} contacts.`);

    window.addEventListener('voice-read-list', handleReadList);
    window.addEventListener('voice-read-page', handleReadPage);

    return () => {
      window.removeEventListener('voice-read-list', handleReadList);
      window.removeEventListener('voice-read-page', handleReadPage);
    };
  }, [contacts.length]);

  const readContact = (contact) => {
    const contactText = `Contact: ${contact.name}. Email: ${contact.email}. Phone: ${contact.phone}. Notes: ${contact.notes}`;
    speak(contactText);
    setSelectedContact(contact.id);
    onAnnouncement(`Reading contact: ${contact.name}`);
  };

  const readContactsList = () => {
    const filteredContacts = contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredContacts.length === 0) {
      speak("No contacts found");
      onAnnouncement("No contacts found");
      return;
    }
    
    const listText = `You have ${filteredContacts.length} contacts. ${filteredContacts.map((contact, index) => 
      `Contact ${index + 1}: ${contact.name}, ${contact.email}`
    ).join('. ')}`;
    speak(listText);
    onAnnouncement(`Reading contacts list. ${filteredContacts.length} contacts found.`);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.email) {
      speak("Please fill in name and email to add contact");
      onAnnouncement("Please fill in name and email to add contact");
      return;
    }
    
    const contact = {
      id: Date.now(),
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      notes: newContact.notes
    };
    
    setContacts(prev => [...prev, contact]);
    localStorage.setItem('contacts', JSON.stringify([...contacts, contact]));
    
    speak(`Contact ${contact.name} added successfully`);
    onAnnouncement(`Contact ${contact.name} added successfully`);
    
    setNewContact({ name: "", email: "", phone: "", notes: "" });
    setIsAddingContact(false);
  };

  const handleVoiceInput = async (field) => {
    try {
      speak(`Please speak the contact's ${field}`);
      const transcript = await listen();
      
      let cleanValue = transcript.trim();
      if (field === 'email') {
        cleanValue = cleanValue.toLowerCase().replace(/\s+/g, '');
      }

      setNewContact(prev => ({ ...prev, [field]: cleanValue }));
      speak(`${field} set to ${cleanValue}`);
    } catch (err) {
      speak(`Sorry, I didn't catch that ${field}.`);
    }
  };

  const deleteContact = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      const updatedContacts = contacts.filter(c => c.id !== contactId);
      setContacts(updatedContacts);
      localStorage.setItem('contacts', JSON.stringify(updatedContacts));
      
      speak(`Contact ${contact.name} deleted`);
      onAnnouncement(`Contact ${contact.name} deleted`);
    }
  };

  const editContact = (contact) => {
    setNewContact(contact);
    setIsAddingContact(true);
    speak(`Editing contact ${contact.name}`);
    onAnnouncement(`Editing contact ${contact.name}`);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card" role="region" aria-label="Contacts">
      <h2 tabIndex="0">Contacts ({contacts.length} contacts)</h2>
      
      <div className="contacts-controls">
        <button 
          onClick={readContactsList}
          className="read-contacts-btn"
          disabled={isSpeaking}
          aria-label="Read contacts list"
        >
          📋 Read Contacts List
        </button>
        
        <button 
          onClick={() => setIsAddingContact(!isAddingContact)}
          className="add-contact-btn"
          aria-label="Add new contact"
        >
          ➕ Add Contact
        </button>
        
        {isSpeaking && (
          <button 
            onClick={() => speak("")}
            className="stop-reading-btn"
            aria-label="Stop reading"
          >
            🔇 Stop Reading
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-section">
        <label htmlFor="contact-search" className="search-label">
          Search Contacts:
        </label>
        <input
          id="contact-search"
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-describedby="search-help"
        />
        <div id="search-help" className="search-help">
          Type to filter contacts by name or email
        </div>
      </div>

      {/* Add/Edit Contact Form */}
      {isAddingContact && (
        <div className="add-contact-form" role="form" aria-label="Add or edit contact">
          <h3>{newContact.id ? 'Edit Contact' : 'Add New Contact'}</h3>
          
          <div className="form-fields">
            <label htmlFor="contact-name" className="field-label">
              Name: *
            </label>
            <div className="form-group">
              <input
                id="contact-name"
                type="text"
                placeholder="Contact name"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                className="form-input"
                required
              />
              <button 
                type="button" 
                className="voice-input-btn"
                onClick={() => handleVoiceInput('name')}
                aria-label="Speak contact name"
              >
                🎙️
              </button>
            </div>

            <label htmlFor="contact-email" className="field-label">
              Email: *
            </label>
            <div className="form-group">
              <input
                id="contact-email"
                type="email"
                placeholder="Contact email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                className="form-input"
                required
              />
              <button 
                type="button" 
                className="voice-input-btn"
                onClick={() => handleVoiceInput('email')}
                aria-label="Speak contact email"
              >
                🎙️
              </button>
            </div>

            <label htmlFor="contact-phone" className="field-label">
              Phone:
            </label>
            <input
              id="contact-phone"
              type="tel"
              placeholder="Phone number"
              value={newContact.phone}
              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              className="form-input"
            />

            <label htmlFor="contact-notes" className="field-label">
              Notes:
            </label>
            <textarea
              id="contact-notes"
              placeholder="Additional notes about this contact"
              value={newContact.notes}
              onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button onClick={addContact} className="save-contact-btn">
              💾 {newContact.id ? 'Update Contact' : 'Add Contact'}
            </button>
            
            <button 
              onClick={() => {
                setIsAddingContact(false);
                setNewContact({ name: "", email: "", phone: "", notes: "" });
              }}
              className="cancel-btn"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="contacts-list" role="list" aria-label="Contacts list">
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <p>{searchTerm ? 'No contacts match your search.' : 'No contacts yet.'}</p>
            <p>Click "Add Contact" to create your first contact!</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              className={`contact ${selectedContact === contact.id ? 'selected' : ''}`}
              onClick={() => readContact(contact)}
              role="button"
              tabIndex="0"
              aria-label={`Contact ${contact.name}. Email: ${contact.email}. Double tap to hear full details.`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  readContact(contact);
                }
              }}
            >
              <div className="contact-header">
                <h4 className="contact-name">{contact.name}</h4>
                <p className="contact-email">{contact.email}</p>
                {contact.phone && <p className="contact-phone">{contact.phone}</p>}
                {contact.notes && <p className="contact-notes">{contact.notes}</p>}
              </div>

              <div className="contact-actions">
                <button 
                  onClick={() => readContact(contact)}
                  className="read-contact-btn"
                  aria-label={`Read contact ${contact.name}`}
                >
                  📖 Read
                </button>
                
                <button 
                  onClick={() => editContact(contact)}
                  className="edit-contact-btn"
                  aria-label={`Edit contact ${contact.name}`}
                >
                  ✏️ Edit
                </button>
                
                <button 
                  onClick={() => {
                    // In a real app, this would open compose with pre-filled recipient
                    speak(`Opening compose to ${contact.name}`);
                    onAnnouncement(`Opening compose to ${contact.name}`);
                  }}
                  className="email-contact-btn"
                  aria-label={`Email ${contact.name}`}
                >
                  📧 Email
                </button>
                
                <button 
                  onClick={() => deleteContact(contact.id)}
                  className="delete-contact-btn"
                  aria-label={`Delete contact ${contact.name}`}
                >
                  🗑️ Delete
                </button>
              </div>
              
              <hr />
            </div>
          ))
        )}
      </div>

      <div className="contacts-help">
        <h3>Contacts Help:</h3>
        <ul>
          <li>Click "Read Contacts List" to hear all contacts</li>
          <li>Click "Read" to hear full contact details</li>
          <li>Use "Email" to compose an email to this contact</li>
          <li>Search contacts by name or email address</li>
          <li>Use Tab to navigate between contacts</li>
          <li>Press Enter or Space on a contact to read it</li>
        </ul>
      </div>
    </div>
  );
}
