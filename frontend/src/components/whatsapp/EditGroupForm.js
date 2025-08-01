import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { whatsappGroupApi } from '../../services/whatsappApi';
import { Box, Typography, TextField, Button, CircularProgress, Alert, Paper, List, ListItem, ListItemText, IconButton, ListItemSecondaryAction, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const EditGroupForm = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [members, setMembers] = useState([]);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const result = await whatsappGroupApi.getGroupById(groupId);
        setGroup(result.data || result);
        // If real WhatsApp group, fetch members
        if (groupId.endsWith('@g.us')) {
          const groupList = await whatsappGroupApi.getRealWhatsAppGroups();
          const found = groupList.data.groups.find(g => g.id === groupId);
          setMembers(found ? found.participants : []);
        }
      } catch (error) {
        setAlert({ show: true, type: 'error', message: 'Failed to load group.' });
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  const handleChange = (e) => {
    setGroup({ ...group, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await whatsappGroupApi.updateGroup(groupId, group);
      setAlert({ show: true, type: 'success', message: 'Group updated successfully!' });
      setTimeout(() => navigate('/dashboard/whatsapp/groups'), 1500);
    } catch (error) {
      setAlert({ show: true, type: 'error', message: 'Failed to update group.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setRemovingMemberId(memberId);
    try {
      await whatsappGroupApi.removeMemberFromWhatsAppGroup(groupId, memberId);
      setMembers(members.filter(m => m.id !== memberId));
      setAlert({ show: true, type: 'success', message: 'Member removed successfully.' });
    } catch (error) {
      setAlert({ show: true, type: 'error', message: 'Failed to remove member.' });
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!group) return <Alert severity="error">Group not found</Alert>;

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Edit Group</Typography>
      {alert.show && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.message}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Group Name"
          name="name"
          value={group.name || ''}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          name="description"
          value={group.description || ''}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary" disabled={loading}>
          Save Changes
        </Button>
      </form>
      {groupId.endsWith('@g.us') && members.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Group Members</Typography>
          <List>
            {members.map((member) => (
              <React.Fragment key={member.id}>
                <ListItem>
                  <ListItemText
                    primary={member.id}
                    secondary={member.isAdmin ? 'Admin' : ''}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="remove"
                      color="error"
                      disabled={removingMemberId === member.id || member.id === group.id}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default EditGroupForm; 