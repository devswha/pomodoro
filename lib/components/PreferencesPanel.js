'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PreferencesContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const PreferenceSection = styled.div`
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

const PreferenceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  @media (min-width: 769px) {
    margin-bottom: 24px;
    padding-bottom: 24px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PreferenceInfo = styled.div`
  flex: 1;
`;

const PreferenceLabel = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;

  @media (min-width: 769px) {
    font-size: 16px;
  }
`;

const PreferenceDescription = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.4;

  @media (min-width: 769px) {
    font-size: 14px;
  }
`;

const PreferenceControl = styled.div`
  margin-left: 20px;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 2px solid #000;
  background: #fff;
  font-size: 14px;
  border-radius: 0;
  color: #000;
  min-width: 120px;
  cursor: pointer;

  &:focus {
    outline: none;
    background: #f8f9fa;
  }

  @media (min-width: 769px) {
    padding: 10px 14px;
    font-size: 16px;
    min-width: 140px;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const NumberInput = styled.input`
  padding: 8px 12px;
  border: 2px solid #000;
  background: #fff;
  font-size: 14px;
  border-radius: 0;
  color: #000;
  width: 80px;
  text-align: center;

  &:focus {
    outline: none;
    background: #f8f9fa;
  }

  @media (min-width: 769px) {
    padding: 10px 14px;
    font-size: 16px;
    width: 100px;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.2s;
    border-radius: 0;
    border: 2px solid #000;

    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: #000;
      transition: 0.2s;
      border-radius: 0;
    }
  }

  input:checked + span {
    background-color: #000;
  }

  input:checked + span:before {
    background-color: #fff;
    transform: translateX(20px);
  }

  @media (min-width: 769px) {
    width: 60px;
    height: 28px;

    span:before {
      height: 20px;
      width: 20px;
    }

    input:checked + span:before {
      transform: translateX(26px);
    }
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #000;
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

const SuccessMessage = styled.div`
  margin: 16px 0;
  padding: 12px 16px;
  background: #d4edda;
  border: 2px solid #28a745;
  color: #155724;
  font-size: 14px;
  border-radius: 0;
  text-align: center;
`;

const ErrorMessage = styled.div`
  margin: 16px 0;
  padding: 12px 16px;
  background: #f8d7da;
  border: 2px solid #dc3545;
  color: #721c24;
  font-size: 14px;
  border-radius: 0;
  text-align: center;
`;

const ThemePreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const ThemeOption = styled.div`
  padding: 16px;
  border: 2px solid ${props => props.selected ? '#000' : '#ccc'};
  background: ${props => {
    switch (props.theme) {
      case 'dark': return '#000';
      case 'minimal': return '#fff';
      case 'high-contrast': return '#000';
      default: return '#fff';
    }
  }};
  color: ${props => {
    switch (props.theme) {
      case 'dark': return '#fff';
      case 'minimal': return '#000';
      case 'high-contrast': return '#fff';
      default: return '#000';
    }
  }};
  text-align: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  @media (min-width: 769px) {
    padding: 20px;
    font-size: 14px;
  }
`;

const ImportExportContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FileInput = styled.input`
  display: none;
`;

export default function PreferencesPanel({ userProfile, setUserProfile, userManager, currentUser }) {
  const [preferences, setPreferences] = useState({
    defaultPomodoroLength: 25,
    breakLength: 5,
    longBreakLength: 15,
    weeklyGoal: 140,
    theme: 'minimal',
    soundEnabled: true,
    notificationsEnabled: true,
    autoStartBreak: false,
    autoStartPomodoro: false,
    pomodorosUntilLongBreak: 4,
    soundVolume: 50,
    notificationSound: 'bell',
    focusMode: 'normal',
    showProgressBar: true,
    showSessionStats: true
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (userProfile?.preferences) {
      setPreferences(prev => ({
        ...prev,
        ...userProfile.preferences
      }));
    }
  }, [userProfile]);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setMessage({ type: '', text: '' }); // Clear any messages
  };

  const handleSavePreferences = async () => {
    if (!userManager || !currentUser) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updatedProfile = await userManager.updateUserProfile(currentUser.id, {
        preferences: preferences
      });
      setUserProfile(updatedProfile);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaultPrefs = {
      defaultPomodoroLength: 25,
      breakLength: 5,
      longBreakLength: 15,
      weeklyGoal: 140,
      theme: 'minimal',
      soundEnabled: true,
      notificationsEnabled: true,
      autoStartBreak: false,
      autoStartPomodoro: false,
      pomodorosUntilLongBreak: 4,
      soundVolume: 50,
      notificationSound: 'bell',
      focusMode: 'normal',
      showProgressBar: true,
      showSessionStats: true
    };
    setPreferences(defaultPrefs);
  };

  const handleExportPreferences = () => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pomodoro-preferences-${currentUser.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportPreferences = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedPrefs = JSON.parse(e.target.result);
        setPreferences(prev => ({ ...prev, ...importedPrefs }));
        setMessage({ type: 'success', text: 'Preferences imported successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid preferences file format' });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  return (
    <PreferencesContainer>
      <PreferenceSection>
        <SectionHeader>Pomodoro Settings</SectionHeader>
        <SectionContent>
          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Focus Session Length</PreferenceLabel>
              <PreferenceDescription>Duration of each pomodoro session in minutes</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <NumberInput
                type="number"
                min="10"
                max="60"
                value={preferences.defaultPomodoroLength}
                onChange={(e) => handlePreferenceChange('defaultPomodoroLength', parseInt(e.target.value) || 25)}
              />
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Short Break Length</PreferenceLabel>
              <PreferenceDescription>Duration of short breaks between sessions</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <NumberInput
                type="number"
                min="1"
                max="30"
                value={preferences.breakLength}
                onChange={(e) => handlePreferenceChange('breakLength', parseInt(e.target.value) || 5)}
              />
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Long Break Length</PreferenceLabel>
              <PreferenceDescription>Duration of long breaks after multiple sessions</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <NumberInput
                type="number"
                min="10"
                max="60"
                value={preferences.longBreakLength}
                onChange={(e) => handlePreferenceChange('longBreakLength', parseInt(e.target.value) || 15)}
              />
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Pomodoros Until Long Break</PreferenceLabel>
              <PreferenceDescription>Number of pomodoros before taking a long break</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <NumberInput
                type="number"
                min="2"
                max="8"
                value={preferences.pomodorosUntilLongBreak}
                onChange={(e) => handlePreferenceChange('pomodorosUntilLongBreak', parseInt(e.target.value) || 4)}
              />
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Weekly Goal</PreferenceLabel>
              <PreferenceDescription>Target minutes of focused work per week</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <NumberInput
                type="number"
                min="60"
                max="1000"
                step="10"
                value={preferences.weeklyGoal}
                onChange={(e) => handlePreferenceChange('weeklyGoal', parseInt(e.target.value) || 140)}
              />
            </PreferenceControl>
          </PreferenceRow>
        </SectionContent>
      </PreferenceSection>

      <PreferenceSection>
        <SectionHeader>Automation & Behavior</SectionHeader>
        <SectionContent>
          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Auto-start Breaks</PreferenceLabel>
              <PreferenceDescription>Automatically start break timer when pomodoro completes</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Toggle>
                <input
                  type="checkbox"
                  checked={preferences.autoStartBreak}
                  onChange={(e) => handlePreferenceChange('autoStartBreak', e.target.checked)}
                />
                <span></span>
              </Toggle>
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Auto-start Pomodoros</PreferenceLabel>
              <PreferenceDescription>Automatically start next pomodoro when break completes</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Toggle>
                <input
                  type="checkbox"
                  checked={preferences.autoStartPomodoro}
                  onChange={(e) => handlePreferenceChange('autoStartPomodoro', e.target.checked)}
                />
                <span></span>
              </Toggle>
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Focus Mode</PreferenceLabel>
              <PreferenceDescription>Block distracting websites during focus sessions</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Select
                value={preferences.focusMode}
                onChange={(e) => handlePreferenceChange('focusMode', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="strict">Strict</option>
                <option value="minimal">Minimal UI</option>
              </Select>
            </PreferenceControl>
          </PreferenceRow>
        </SectionContent>
      </PreferenceSection>

      <PreferenceSection>
        <SectionHeader>Audio & Notifications</SectionHeader>
        <SectionContent>
          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Sound Notifications</PreferenceLabel>
              <PreferenceDescription>Play sound when sessions start and end</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Toggle>
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
                />
                <span></span>
              </Toggle>
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Browser Notifications</PreferenceLabel>
              <PreferenceDescription>Show desktop notifications for session changes</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Toggle>
                <input
                  type="checkbox"
                  checked={preferences.notificationsEnabled}
                  onChange={(e) => handlePreferenceChange('notificationsEnabled', e.target.checked)}
                />
                <span></span>
              </Toggle>
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Sound Volume</PreferenceLabel>
              <PreferenceDescription>Adjust notification sound volume (0-100)</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <NumberInput
                type="number"
                min="0"
                max="100"
                value={preferences.soundVolume}
                onChange={(e) => handlePreferenceChange('soundVolume', parseInt(e.target.value) || 50)}
              />
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Notification Sound</PreferenceLabel>
              <PreferenceDescription>Choose notification sound effect</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Select
                value={preferences.notificationSound}
                onChange={(e) => handlePreferenceChange('notificationSound', e.target.value)}
              >
                <option value="bell">Bell</option>
                <option value="chime">Chime</option>
                <option value="ding">Ding</option>
                <option value="beep">Beep</option>
              </Select>
            </PreferenceControl>
          </PreferenceRow>
        </SectionContent>
      </PreferenceSection>

      <PreferenceSection>
        <SectionHeader>Theme & Display</SectionHeader>
        <SectionContent>
          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Theme</PreferenceLabel>
              <PreferenceDescription>Choose your preferred visual theme</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <ThemePreview>
                <ThemeOption
                  theme="minimal"
                  selected={preferences.theme === 'minimal'}
                  onClick={() => handlePreferenceChange('theme', 'minimal')}
                >
                  Minimal
                </ThemeOption>
                <ThemeOption
                  theme="dark"
                  selected={preferences.theme === 'dark'}
                  onClick={() => handlePreferenceChange('theme', 'dark')}
                >
                  Dark
                </ThemeOption>
                <ThemeOption
                  theme="high-contrast"
                  selected={preferences.theme === 'high-contrast'}
                  onClick={() => handlePreferenceChange('theme', 'high-contrast')}
                >
                  High Contrast
                </ThemeOption>
              </ThemePreview>
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Show Progress Bar</PreferenceLabel>
              <PreferenceDescription>Display progress bar during sessions</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Toggle>
                <input
                  type="checkbox"
                  checked={preferences.showProgressBar}
                  onChange={(e) => handlePreferenceChange('showProgressBar', e.target.checked)}
                />
                <span></span>
              </Toggle>
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Show Session Statistics</PreferenceLabel>
              <PreferenceDescription>Display real-time statistics on main page</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Toggle>
                <input
                  type="checkbox"
                  checked={preferences.showSessionStats}
                  onChange={(e) => handlePreferenceChange('showSessionStats', e.target.checked)}
                />
                <span></span>
              </Toggle>
            </PreferenceControl>
          </PreferenceRow>
        </SectionContent>
      </PreferenceSection>

      <PreferenceSection>
        <SectionHeader>Import & Export</SectionHeader>
        <SectionContent>
          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Backup & Restore</PreferenceLabel>
              <PreferenceDescription>Export or import your preference settings</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <ImportExportContainer>
                <Button type="button" onClick={handleExportPreferences}>
                  Export Settings
                </Button>
                <Button type="button" onClick={() => document.getElementById('import-preferences').click()}>
                  Import Settings
                </Button>
                <FileInput
                  id="import-preferences"
                  type="file"
                  accept=".json"
                  onChange={handleImportPreferences}
                />
              </ImportExportContainer>
            </PreferenceControl>
          </PreferenceRow>

          <PreferenceRow>
            <PreferenceInfo>
              <PreferenceLabel>Reset to Defaults</PreferenceLabel>
              <PreferenceDescription>Restore all settings to their default values</PreferenceDescription>
            </PreferenceInfo>
            <PreferenceControl>
              <Button type="button" onClick={handleResetToDefaults}>
                Reset Defaults
              </Button>
            </PreferenceControl>
          </PreferenceRow>
        </SectionContent>
      </PreferenceSection>

      {message.text && (
        message.type === 'success' ? (
          <SuccessMessage>{message.text}</SuccessMessage>
        ) : (
          <ErrorMessage>{message.text}</ErrorMessage>
        )
      )}

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <Button onClick={handleSavePreferences} disabled={loading}>
          {loading ? 'Saving...' : 'Save All Preferences'}
        </Button>
      </div>
    </PreferencesContainer>
  );
}