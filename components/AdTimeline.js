import React from 'react';
import { Typography, Button, Grid, Paper, IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Box, Tooltip } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerIcon from '@mui/icons-material/Timer';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

const AdTimeline = ({ 
    currentVideoAds, 
    hasUnsavedChanges, 
    onPlayVideoWithAds, 
    onVote, 
    formatTime, 
    onPlayAd, 
    onUpdateAd,
    onDeleteAd,
    voices,
    estimateDuration,
    onRequestImprovement
}) => {
    const [editingId, setEditingId] = React.useState(null);
    const [editForm, setEditForm] = React.useState({});

    const handleStartEdit = (ad) => {
        setEditingId(ad.id);
        setEditForm({ ...ad });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = () => {
        // Recalculate duration if text or rate changed
        const newDuration = estimateDuration(editForm.text, editForm.rate);
        const updatedAd = { ...editForm, duration: newDuration };
        onUpdateAd(updatedAd);
        setEditingId(null);
    };

    const handleFormChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };
    return (
        <div>
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
                <Typography variant="h5" sx={{ flexGrow: 1, minWidth: 0, color: "#212121", fontWeight: 700 }}>
                     Saved Descriptions ({currentVideoAds.length}) {hasUnsavedChanges && <span style={{ color: '#bf360c', fontSize: '0.6em', verticalAlign: 'middle' }}>(Unsaved Edits)</span>}
                </Typography>
                <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<PlayArrowIcon />}
                    onClick={onPlayVideoWithAds}
                    size="small"
                >
                    Play with ADs
                </Button>
            </Box>
            
            {currentVideoAds.length === 0 ? (
                <Typography sx={{ color: "#424242", fontStyle: "italic", mt: 2 }}>No descriptions added for this video yet.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {currentVideoAds.map((ad, index) => {
                        const nextAd = currentVideoAds[index + 1];
                        const duration = ad.duration || 0;
                        const effectiveVideoDuration = ad.mode === 'fluid' ? duration * (ad.videoRate || 1) : duration;
                        const isOverlapping = nextAd && (
                            (ad.mode !== 'pause' && ad.time + effectiveVideoDuration > nextAd.time) || 
                            (ad.time === nextAd.time)
                        );
                        const isEditing = editingId === ad.id;

                        return (
                        <Grid item xs={12} key={ad.id}>
                            <Paper
                                style={{
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    borderLeft: isOverlapping ? '4px solid #ff9800' : '4px solid transparent',
                                    backgroundColor: isOverlapping ? '#fffde7' : '#fff',
                                }}
                            >
                                {/* ── ROW 1: timestamp + description text (full width) ── */}
                                {isEditing ? (
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <TextField
                                            label="Time (s)"
                                            type="number"
                                            size="small"
                                            value={editForm.time}
                                            onChange={(e) => handleFormChange('time', parseFloat(e.target.value))}
                                            sx={{ width: '100px' }}
                                        />
                                        <TextField
                                            label="Description Text"
                                            multiline
                                            size="small"
                                            value={editForm.text}
                                            onChange={(e) => handleFormChange('text', e.target.value)}
                                            sx={{ flex: 1, minWidth: '180px' }}
                                        />
                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#1565c0', display: 'block', mb: 0.5 }}>
                                            {formatTime(ad.time)}
                                            {isOverlapping && (
                                                <Tooltip title={`Warning: Overlaps with next AD (consumes ${effectiveVideoDuration.toFixed(1)}s)`}>
                                                    <WarningAmberIcon sx={{ fontSize: '0.9rem', color: '#ff9800', ml: 0.5, verticalAlign: 'middle' }} />
                                                </Tooltip>
                                            )}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#212121', lineHeight: 1.5 }}>
                                            {ad.text}
                                        </Typography>
                                    </Box>
                                )}

                                {/* ── ROW 2: meta chips + action buttons ── */}
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, borderTop: '1px solid #f0f0f0', pt: 1 }}>
                                    {/* Vote controls */}
                                    {!isEditing && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mr: 0.5 }}>
                                            <IconButton size="small" onClick={() => onVote(ad.id, 'up')} color="primary" aria-label="Upvote Description">
                                                <ThumbUpIcon sx={{ fontSize: '1rem' }} />
                                            </IconButton>
                                            <Typography variant="caption" sx={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{ad.votes || 0}</Typography>
                                            <IconButton size="small" onClick={() => onVote(ad.id, 'down')} color="secondary" aria-label="Downvote Description">
                                                <ThumbDownIcon sx={{ fontSize: '1rem' }} />
                                            </IconButton>
                                        </Box>
                                    )}

                                    {/* Duration chip */}
                                    {!isEditing && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#757575', mr: 0.5 }}>
                                            <TimerIcon sx={{ fontSize: '0.85rem', mr: '2px' }} />
                                            <Typography variant="caption">{duration.toFixed(1)}s</Typography>
                                        </Box>
                                    )}

                                    {/* Mode badge */}
                                    {!isEditing && (
                                        <Typography variant="caption" sx={{ bgcolor: '#e0e0e0', px: '6px', py: '2px', borderRadius: '4px', fontWeight: 500 }}>
                                            {ad.mode?.toUpperCase()}
                                            {ad.mode === 'fluid' && ` · ${ad.videoRate || 1}x · ${ad.videoVolume ?? 50}%vol`}
                                        </Typography>
                                    )}

                                    {/* Voice label */}
                                    {!isEditing && ad.voice && (
                                        <Typography variant="caption" sx={{ color: '#616161', fontStyle: 'italic', flexGrow: 1 }}>
                                            {ad.voice} ({ad.rate}x)
                                        </Typography>
                                    )}

                                    {/* Suggest improvement */}
                                    {!isEditing && ad.votes < 0 && (
                                        <Tooltip title="Downvoted — suggest an improvement?">
                                            <IconButton size="small" color="warning" onClick={() => onRequestImprovement(ad)} aria-label="Suggest improvement">
                                                <TipsAndUpdatesIcon sx={{ fontSize: '1rem' }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    {/* Spacer */}
                                    <Box sx={{ flexGrow: 1 }} />

                                    {/* Edit / Save / Cancel / Play / Delete */}
                                    {isEditing ? (
                                        <>
                                            <IconButton onClick={handleSaveEdit} color="primary" size="small" aria-label="Save Changes">
                                                <SaveIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={handleCancelEdit} color="secondary" size="small" aria-label="Cancel Edit">
                                                <CancelIcon fontSize="small" />
                                            </IconButton>
                                        </>
                                    ) : (
                                        <>
                                            <IconButton onClick={() => handleStartEdit(ad)} color="primary" size="small" aria-label="Edit description">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => onPlayAd(ad)} color="primary" size="small" aria-label="Preview Description">
                                                <PlayArrowIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => onDeleteAd(ad.id)} color="secondary" size="small" aria-label="Delete Description">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </>
                                    )}
                                </Box>

                                {/* ── ROW 3: edit-mode voice/rate/mode controls ── */}
                                {isEditing && (
                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', pt: 1, borderTop: '1px solid #f0f0f0' }}>
                                        <FormControl size="small" sx={{ minWidth: '150px', flex: 1 }}>
                                            <InputLabel>Voice</InputLabel>
                                            <Select value={editForm.voice} label="Voice" onChange={(e) => handleFormChange('voice', e.target.value)}>
                                                {voices.map((v, i) => (
                                                    <MenuItem key={i} value={v.name}>{v.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '100px', flex: 1 }}>
                                            <Typography variant="caption">Rate: {editForm.rate}x</Typography>
                                            <input type="range" min={0.5} max={4} step={0.1} value={editForm.rate} onChange={(e) => handleFormChange('rate', parseFloat(e.target.value))} style={{ width: '100%' }} aria-label={`Speech rate: ${editForm.rate}x`} />
                                        </Box>
                                        <FormControl size="small" sx={{ minWidth: '100px' }}>
                                            <InputLabel>Mode</InputLabel>
                                            <Select value={editForm.mode} label="Mode" onChange={(e) => handleFormChange('mode', e.target.value)}>
                                                <MenuItem value="pause">Pause</MenuItem>
                                                <MenuItem value="duck">Duck</MenuItem>
                                                <MenuItem value="fluid">Fluid</MenuItem>
                                            </Select>
                                        </FormControl>
                                        {editForm.mode === 'fluid' && (
                                            <>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '100px', flex: 1 }}>
                                                    <Typography variant="caption">Video Rate: {editForm.videoRate || 1}x</Typography>
                                                    <input type="range" min={0.25} max={2} step={0.05} value={editForm.videoRate || 1} onChange={(e) => handleFormChange('videoRate', parseFloat(e.target.value))} style={{ width: '100%' }} aria-label={`Video rate: ${editForm.videoRate || 1}x`} />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '100px', flex: 1 }}>
                                                    <Typography variant="caption">Vol: {editForm.videoVolume ?? 50}%</Typography>
                                                    <input type="range" min={0} max={100} step={1} value={editForm.videoVolume ?? 50} onChange={(e) => handleFormChange('videoVolume', parseInt(e.target.value))} style={{ width: '100%' }} aria-label={`Video volume: ${editForm.videoVolume ?? 50}%`} />
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                        );
                    })}
                </Grid>
            )}
        </div>
    );
};

export default React.memo(AdTimeline);
