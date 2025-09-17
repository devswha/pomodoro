'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SettingsContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const SettingsSection = styled.div`
  background: #fff;
  border: 2px solid #000;
  margin-bottom: 24px;
  border-radius: 0;

  @media (min-width: 769px) {
    margin-bottom: 32px;
  }
`;

const SectionHeader = styled.div`
  padding: 20px 24px;
  background: #000;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;

  @media (min-width: 769px) {
    padding: 24px 32px;
    font-size: 18px;
  }
`;

const SectionContent = styled.div`
  padding: 24px;

  @media (min-width: 769px) {
    padding: 32px;
  }
`;

const FormRow = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (min-width: 769px) {
    margin-bottom: 24px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (min-width: 769px) {
    font-size: 16px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #000;
  background: #fff;
  font-size: 14px;
  border-radius: 0;
  color: #000;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    background: #f8f9fa;
  }

  &:disabled {
    background: #e9ecef;
    color: #666;
    cursor: not-allowed;
  }

  @media (min-width: 769px) {
    padding: 14px 18px;
    font-size: 16px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px 16px;
  border: 2px solid #000;
  background: #fff;
  font-size: 14px;
  border-radius: 0;
  color: #000;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    background: #f8f9fa;
  }

  @media (min-width: 769px) {
    padding: 14px 18px;
    font-size: 16px;
    min-height: 120px;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: ${props => props.variant === 'danger' ? '#dc3545' : '#000'};
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s ease;
  margin-right: 12px;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.7;
  }

  &:last-child {
    margin-right: 0;
  }

  @media (min-width: 769px) {
    padding: 14px 28px;
    font-size: 16px;
    margin-right: 16px;
  }
`;

const PasswordStrength = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: ${props => {
    switch (props.strength) {
      case 'strong': return '#28a745';
      case 'medium': return '#ffc107';
      case 'weak': return '#dc3545';
      default: return '#666';
    }
  }};
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  font-size: 14px;
  border-radius: 0;
`;

const SuccessMessage = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  font-size: 14px;
  border-radius: 0;
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ConfirmContent = styled.div`
  background: #fff;
  border: 2px solid #000;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const ConfirmTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
`;

const ConfirmText = styled.p`
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Must contain lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Must contain number');
  }
  
  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
    errors.push('Must contain special character');
  }
  
  const strength = {
    weak: errors.length > 2,
    medium: errors.length === 1 || errors.length === 2,
    strong: errors.length === 0
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: strength.strong ? 'strong' : (strength.medium ? 'medium' : 'weak')
  };
};

export default function ProfileSettings({ userProfile, setUserProfile, userManager, currentUser }) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        bio: userProfile.bio || ''
      }));
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      if (value) {
        setPasswordStrength(validatePasswordStrength(value));
      } else {
        setPasswordStrength(null);
      }
    }
    
    // Clear messages on input change
    setError('');
    setSuccess('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!userManager || !currentUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updates = {
        displayName: formData.displayName,
        email: formData.email,
        bio: formData.bio
      };

      const updatedProfile = await userManager.updateUserProfile(currentUser.id, updates);
      setUserProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!userManager || !currentUser) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!passwordStrength?.isValid) {
      setError('Password does not meet security requirements');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updates = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      };

      await userManager.updateUserProfile(currentUser.id, updates);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setPasswordStrength(null);
      setSuccess('Password changed successfully!');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userManager || !currentUser) return;

    try {
      await userManager.deleteUser(currentUser.id);
      // Redirect to login or home page after deletion
      window.location.href = '/login';
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <SettingsContainer>
        <SettingsSection>
          <SectionHeader>Personal Information</SectionHeader>
          <SectionContent>
            <form onSubmit={handleProfileUpdate}>
              <FormRow>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Your display name"
                />
              </FormRow>

              <FormRow>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                />
              </FormRow>

              <FormRow>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                />
              </FormRow>

              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>{success}</SuccessMessage>}

              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </SectionContent>
        </SettingsSection>

        <SettingsSection>
          <SectionHeader>Change Password</SectionHeader>
          <SectionContent>
            <form onSubmit={handlePasswordChange}>
              <FormRow>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your current password"
                />
              </FormRow>

              <FormRow>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                />
                {passwordStrength && (
                  <PasswordStrength strength={passwordStrength.strength}>
                    Password strength: {passwordStrength.strength.toUpperCase()}
                    {passwordStrength.errors.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        {passwordStrength.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    )}
                  </PasswordStrength>
                )}
              </FormRow>

              <FormRow>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                />
              </FormRow>

              <Button type="submit" disabled={loading || !formData.newPassword || !formData.currentPassword}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </SectionContent>
        </SettingsSection>

        <SettingsSection>
          <SectionHeader>Account Management</SectionHeader>
          <SectionContent>
            <FormRow>
              <Label>Account Status</Label>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                Account created: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
            </FormRow>

            <FormRow>
              <Label>Data Export</Label>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                Download all your profile, statistics, sessions, and meeting data as a JSON file for backup or migration purposes.
              </div>
              <div style={{ marginBottom: '16px' }}>
                <Button 
                  type="button"
                  onClick={() => {
                    try {
                      const userData = {
                        profile: userProfile,
                        stats: userManager?.getUserStats(currentUser.id),
                        sessions: userManager?.getUserSessions(currentUser.id),
                        meetings: userManager?.getMeetings(currentUser.id),
                        exportDate: new Date().toISOString(),
                        version: '4.0.0',
                        userId: currentUser.id
                      };
                      const dataStr = JSON.stringify(userData, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `pomodoro-data-${currentUser.id}-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      setSuccess('Data exported successfully!');
                    } catch (err) {
                      setError('Failed to export data: ' + err.message);
                    }
                  }}
                >
                  Export My Data
                </Button>
              </div>
            </FormRow>

            <FormRow>
              <Label>Data Import</Label>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                Import profile settings from a previously exported file. This will merge with your existing data where possible.
              </div>
              <div style={{ marginBottom: '16px' }}>
                <Button 
                  type="button"
                  onClick={() => document.getElementById('data-import-file').click()}
                >
                  Import Data
                </Button>
                <input
                  id="data-import-file"
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const importedData = JSON.parse(event.target.result);
                        
                        // Validate the imported data structure
                        if (!importedData.profile && !importedData.stats && !importedData.sessions) {
                          throw new Error('Invalid data format - missing required sections');
                        }

                        // Show confirmation dialog
                        if (window.confirm('This will update your profile settings with imported data. Your statistics and sessions will not be modified for security. Continue?')) {
                          // Only import safe profile data
                          const safeUpdates = {};
                          if (importedData.profile?.displayName) {
                            safeUpdates.displayName = importedData.profile.displayName;
                          }
                          if (importedData.profile?.bio) {
                            safeUpdates.bio = importedData.profile.bio;
                          }
                          if (importedData.profile?.preferences) {
                            safeUpdates.preferences = {
                              ...userProfile?.preferences,
                              ...importedData.profile.preferences
                            };
                          }

                          if (Object.keys(safeUpdates).length > 0) {
                            userManager?.updateUserProfile(currentUser.id, safeUpdates)
                              .then((updatedProfile) => {
                                setUserProfile(updatedProfile);
                                setFormData(prev => ({
                                  ...prev,
                                  displayName: updatedProfile.displayName || '',
                                  bio: updatedProfile.bio || ''
                                }));
                                setSuccess('Profile data imported successfully!');
                              })
                              .catch((err) => {
                                setError('Failed to import data: ' + err.message);
                              });
                          } else {
                            setError('No valid profile data found to import');
                          }
                        }
                      } catch (err) {
                        setError('Failed to parse import file: ' + err.message);
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = ''; // Reset file input
                  }}
                />
              </div>
            </FormRow>

            <FormRow>
              <Label>Delete Account</Label>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#dc3545' }}>
                Warning: This action cannot be undone. All your data will be permanently deleted.
              </div>
              <Button 
                type="button" 
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            </FormRow>
          </SectionContent>
        </SettingsSection>
      </SettingsContainer>

      {showDeleteConfirm && (
        <ConfirmDialog>
          <ConfirmContent>
            <ConfirmTitle>Delete Account</ConfirmTitle>
            <ConfirmText>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </ConfirmText>
            <ButtonGroup>
              <Button 
                type="button" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="danger"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </ButtonGroup>
          </ConfirmContent>
        </ConfirmDialog>
      )}
    </>
  );
}