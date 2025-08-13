import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { whiteboardService } from '../../services/whiteboardService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  PencilIcon,
  Square3Stack3DIcon,
  CircleStackIcon,
  CursorArrowRaysIcon,
  PaintBrushIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const CollaborativeWhiteboard = ({ projectId, whiteboardId, isReadOnly = false }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const stageRef = useRef();
  const [whiteboard, setWhiteboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tool, setTool] = useState('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [objects, setObjects] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState(whiteboardId);
  const [pendingObjects, setPendingObjects] = useState(new Set()); // Track objects being created
  const [queuedUpdates, setQueuedUpdates] = useState(new Map()); // Queue updates for pending objects
  const [isOffline, setIsOffline] = useState(true); // Start in offline mode until server is confirmed
  const [hasTriedServer, setHasTriedServer] = useState(false); // Track if we've attempted server connection

  const colors = [
    '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#880088'
  ];

  // Utility function to handle server operations safely
  const tryServerOperation = async (operation, fallback = null) => {
    if (isOffline) {
      return fallback;
    }
    
    try {
      const result = await operation();
      setIsOffline(false);
      return result;
    } catch (error) {
      if (!hasTriedServer) {
        console.log('Server not available - working offline');
        setHasTriedServer(true);
      }
      setIsOffline(true);
      return fallback;
    }
  };

  useEffect(() => {
    if (projectId || whiteboardId) {
      loadWhiteboard();
    }
  }, [projectId, whiteboardId]);

  // Check server connectivity on load
  useEffect(() => {
    const checkServerConnectivity = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          console.log('Server is available - switching to online mode');
          setIsOffline(false);
        } else {
          console.log('Server responded but not healthy - staying offline');
          setIsOffline(true);
        }
        setHasTriedServer(true);
      } catch (error) {
        console.log('Server not available - staying in offline mode');
        setIsOffline(true);
        setHasTriedServer(true);
      }
    };

    checkServerConnectivity();
  }, []);

  // Socket event listeners for real-time collaboration
  useEffect(() => {
    if (socket && currentWhiteboardId) {
      socket.on('whiteboard_object_added', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects(prev => [...prev, data.object]);
        }
      });

      socket.on('whiteboard_object_updated', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects(prev => prev.map(obj => 
            obj.id === data.objectId 
              ? { ...obj, ...data.updates }
              : obj
          ));
        }
      });

      socket.on('whiteboard_object_deleted', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects(prev => prev.filter(obj => obj.id !== data.objectId));
        }
      });

      socket.on('cursor_updated', (data) => {
        if (data.whiteboardId === currentWhiteboardId && data.userId !== user._id) {
          setCollaborators(prev => {
            const updated = prev.filter(c => c.userId !== data.userId);
            return [...updated, {
              userId: data.userId,
              userName: data.userName,
              cursor: data.cursor
            }];
          });
        }
      });

      socket.on('whiteboard_cleared', (data) => {
        if (data.whiteboardId === currentWhiteboardId) {
          setObjects([]);
        }
      });

      return () => {
        socket.off('whiteboard_object_added');
        socket.off('whiteboard_object_updated');
        socket.off('whiteboard_object_deleted');
        socket.off('cursor_updated');
        socket.off('whiteboard_cleared');
      };
    }
  }, [socket, currentWhiteboardId, user._id]);

  const loadWhiteboard = async () => {
    try {
      setIsLoading(true);
      
      let whiteboardData;
      
      if (whiteboardId) {
        // Load specific whiteboard by ID
        try {
          const response = await whiteboardService.getWhiteboard(whiteboardId);
          whiteboardData = response.data.whiteboard;
          setCurrentWhiteboardId(whiteboardId);
          setIsOffline(false);
          setHasTriedServer(true);
        } catch (error) {
          console.warn('Could not load whiteboard from server, working offline');
          setIsOffline(true);
          setHasTriedServer(true);
          // Create a temporary offline whiteboard
          whiteboardData = {
            _id: whiteboardId,
            name: 'Offline Whiteboard',
            canvas: { objects: [], background: { color: '#ffffff' } },
            collaborators: []
          };
          setCurrentWhiteboardId(whiteboardId);
        }
      } else if (projectId) {
        // Get or create whiteboard for project
        try {
          const response = await whiteboardService.getProjectWhiteboards(projectId);
          const whiteboards = response.data.whiteboards;
          
          if (whiteboards && whiteboards.length > 0) {
            // Use the first (most recent) whiteboard
            whiteboardData = whiteboards[0];
            setCurrentWhiteboardId(whiteboardData._id);
          } else {
            // Create a new whiteboard for the project
            const createResponse = await whiteboardService.createWhiteboard(projectId, {
              name: 'Project Whiteboard',
              canvas: {
                objects: [],
                background: { color: '#ffffff' }
              }
            });
            whiteboardData = createResponse.data.whiteboard;
            setCurrentWhiteboardId(whiteboardData._id);
          }
          setIsOffline(false);
          setHasTriedServer(true);
        } catch (error) {
          console.warn('Could not connect to server, working offline');
          setIsOffline(true);
          setHasTriedServer(true);
          // Create a temporary offline whiteboard
          const offlineId = `offline_${Date.now()}`;
          whiteboardData = {
            _id: offlineId,
            name: 'Offline Whiteboard',
            project: projectId,
            canvas: { objects: [], background: { color: '#ffffff' } },
            collaborators: []
          };
          setCurrentWhiteboardId(offlineId);
        }
      }
      
      if (whiteboardData) {
        setWhiteboard(whiteboardData);
        setObjects(whiteboardData.canvas?.objects || []);
        setCollaborators(whiteboardData.collaborators || []);
      }
    } catch (error) {
      console.error('Error loading whiteboard:', error);
      setIsOffline(true);
      toast.error('Working in offline mode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    if (isReadOnly) return;

    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);

    if (tool === 'pen') {
      setCurrentPath([pos.x, pos.y]);
    } else if (tool === 'rectangle') {
      const rect = {
        id: `rect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth
      };
      // Add object locally first for immediate feedback
      setObjects(prev => [...prev, rect]);
      setSelectedObjectId(rect.id); // Track the object being drawn
    } else if (tool === 'circle') {
      const circle = {
        id: `circle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 0,
        fill: 'transparent',
        stroke: color,
        strokeWidth
      };
      // Add object locally first for immediate feedback
      setObjects(prev => [...prev, circle]);
      setSelectedObjectId(circle.id); // Track the object being drawn
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const textObj = {
          id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          x: pos.x,
          y: pos.y,
          text,
          fontSize: 16,
          fontFamily: 'Arial',
          fill: color
        };
        addObject(textObj);
      }
    } else if (tool === 'sticky_note') {
      const text = prompt('Enter note text:');
      if (text) {
        const note = {
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'sticky_note',
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 100,
          text,
          fill: '#fff2cc',
          stroke: '#d6b656',
          strokeWidth: 1
        };
        addObject(note);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || isReadOnly) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    // Update cursor position for collaborators
    if (socket) {
      socket.emit('cursor_move', {
        projectId: whiteboard?.project,
        whiteboardId: currentWhiteboardId,
        x: point.x,
        y: point.y
      });
    }

    if (tool === 'pen') {
      setCurrentPath(prev => [...prev, point.x, point.y]);
    } else if (tool === 'rectangle' && selectedObjectId) {
      // Update only the selected object locally during drawing
      setObjects(prev => prev.map(obj => {
        if (obj.id === selectedObjectId && obj.type === 'rectangle') {
          const width = point.x - obj.x;
          const height = point.y - obj.y;
          return { ...obj, width, height };
        }
        return obj;
      }));
    } else if (tool === 'circle' && selectedObjectId) {
      // Update only the selected object locally during drawing
      setObjects(prev => prev.map(obj => {
        if (obj.id === selectedObjectId && obj.type === 'circle') {
          const radius = Math.sqrt(
            Math.pow(point.x - obj.x, 2) + Math.pow(point.y - obj.y, 2)
          );
          return { ...obj, radius };
        }
        return obj;
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || isReadOnly) return;

    if (tool === 'pen' && currentPath.length > 2) {
      const line = {
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'line',
        points: currentPath,
        stroke: color,
        strokeWidth,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      };
      addObject(line);
    } else if ((tool === 'rectangle' || tool === 'circle') && selectedObjectId) {
      // Find the object that was being drawn and save it to backend
      const drawnObject = objects.find(obj => obj.id === selectedObjectId);
      if (drawnObject) {
        // Only save if the object has meaningful dimensions
        if ((drawnObject.type === 'rectangle' && (Math.abs(drawnObject.width) > 5 || Math.abs(drawnObject.height) > 5)) ||
            (drawnObject.type === 'circle' && drawnObject.radius > 5)) {
          saveObjectToBackend(drawnObject);
        } else {
          // Remove object if too small
          setObjects(prev => prev.filter(obj => obj.id !== selectedObjectId));
        }
      }
      setSelectedObjectId(null);
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const addObject = async (objectData) => {
    try {
      // Add object locally first
      setObjects(prev => [...prev, objectData]);
      
      // Save to backend immediately
      await saveObjectToBackend(objectData);
    } catch (error) {
      console.error('Error adding object:', error);
      toast.error('Failed to add object');
      
      // Remove failed object from local state
      setObjects(prev => prev.filter(obj => obj.id !== objectData.id));
    }
  };

  const saveObjectToBackend = async (objectData) => {
    try {
      // Mark object as pending
      setPendingObjects(prev => new Set([...prev, objectData.id]));
      
      if (socket) {
        socket.emit('whiteboard_update', {
          projectId: whiteboard?.project,
          action: 'add',
          object: objectData
        });
      }

      // Save to backend using safe server operation
      await tryServerOperation(
        () => whiteboardService.addObject(currentWhiteboardId, objectData),
        null // fallback - do nothing if offline
      );
      
      // Remove from pending once processed (whether online or offline)
      setPendingObjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(objectData.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error saving object to backend:', error);
      // Don't remove from local state if backend save fails in offline mode
      setPendingObjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(objectData.id);
        return newSet;
      });
    }
  };

  const updateObject = async (objectId, updates) => {
    try {
      // Update object locally first
      setObjects(prev => prev.map(obj => 
        obj.id === objectId ? { ...obj, ...updates } : obj
      ));

      if (socket) {
        socket.emit('whiteboard_update', {
          projectId: whiteboard?.project,
          action: 'update',
          object: { id: objectId, ...updates }
        });
      }

      // Save to backend using safe server operation
      await tryServerOperation(
        () => whiteboardService.updateObject(currentWhiteboardId, objectId, updates),
        null // fallback - do nothing if offline
      );
    } catch (error) {
      console.error('Error updating object:', error);
      // Only log the error, don't revert the local change as it might be an offline scenario
    }
  };

  const deleteObject = async (objectId) => {
    try {
      setObjects(prev => prev.filter(obj => obj.id !== objectId));

      if (socket) {
        socket.emit('whiteboard_update', {
          projectId: whiteboard.project,
          action: 'delete',
          object: { id: objectId }
        });
      }

      // Save to backend
      await whiteboardService.deleteObject(currentWhiteboardId, objectId);
    } catch (error) {
      console.error('Error deleting object:', error);
      toast.error('Failed to delete object');
    }
  };

  const clearCanvas = async () => {
    if (window.confirm('Are you sure you want to clear the entire whiteboard?')) {
      try {
        // Clear locally first
        setObjects([]);
        
        if (socket) {
          socket.emit('whiteboard_update', {
            projectId: whiteboard?.project,
            action: 'clear',
            whiteboardId: currentWhiteboardId
          });
        }

        // Clear on backend using dedicated clear endpoint
        await tryServerOperation(
          () => whiteboardService.clearWhiteboard(currentWhiteboardId),
          null // fallback - do nothing if offline
        );
        
        toast.success('Whiteboard cleared');
      } catch (error) {
        console.error('Error clearing whiteboard:', error);
        toast.error('Failed to clear whiteboard');
      }
    }
  };

  const renderObject = (obj, index) => {
    // Ensure object has an ID for React key
    const objectId = obj.id || `object-${index}`;
    
    const commonProps = {
      id: objectId,
      draggable: !isReadOnly,
      onClick: () => setSelectedObjectId(objectId),
      onDragEnd: (e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        
        // Update object position
        updateObject(objectId, {
          x: newX,
          y: newY
        });
      }
    };

    switch (obj.type) {
      case 'rectangle':
        return (
          <Rect
            key={objectId}
            {...commonProps}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        );
      case 'circle':
        return (
          <Circle
            key={objectId}
            {...commonProps}
            x={obj.x}
            y={obj.y}
            radius={obj.radius}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        );
      case 'line':
        return (
          <Line
            key={objectId}
            {...commonProps}
            points={obj.points}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
            tension={obj.tension || 0.5}
            lineCap={obj.lineCap || 'round'}
            lineJoin={obj.lineJoin || 'round'}
          />
        );
      case 'text':
        return (
          <Text
            key={objectId}
            {...commonProps}
            x={obj.x}
            y={obj.y}
            text={obj.text}
            fontSize={obj.fontSize}
            fontFamily={obj.fontFamily}
            fill={obj.fill}
          />
        );
      case 'sticky_note':
        return (
          <Group key={objectId} {...commonProps}>
            <Rect
              x={obj.x}
              y={obj.y}
              width={obj.width}
              height={obj.height}
              fill={obj.fill}
              stroke={obj.stroke}
              strokeWidth={obj.strokeWidth}
              cornerRadius={4}
            />
            <Text
              x={obj.x + 10}
              y={obj.y + 10}
              text={obj.text}
              fontSize={12}
              fontFamily="Arial"
              fill="#333"
              width={obj.width - 20}
              height={obj.height - 20}
              verticalAlign="top"
            />
          </Group>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      {!isReadOnly && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tools */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Tools:</span>
              {[
                { id: 'pen', icon: PencilIcon, label: 'Pen' },
                { id: 'rectangle', icon: Square3Stack3DIcon, label: 'Rectangle' },
                { id: 'circle', icon: CircleStackIcon, label: 'Circle' },
                { id: 'text', icon: CursorArrowRaysIcon, label: 'Text' },
                { id: 'sticky_note', icon: DocumentIcon, label: 'Sticky Note' }
              ].map((toolItem) => {
                const Icon = toolItem.icon;
                return (
                  <button
                    key={toolItem.id}
                    onClick={() => setTool(toolItem.id)}
                    className={`p-2 rounded-md transition-colors ${
                      tool === toolItem.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    title={toolItem.label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Color:</span>
              <div className="flex space-x-1">
                {colors.map((colorOption) => (
                  <button
                    key={colorOption}
                    onClick={() => setColor(colorOption)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      color === colorOption ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Size:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-500">{strokeWidth}px</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-auto">
              {selectedObjectId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteObject(selectedObjectId)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                className="text-gray-600"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative">
        <Stage
          width={window.innerWidth - 100}
          height={600}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {/* Render all objects */}
            {objects.map((obj, index) => renderObject(obj, index))}

            {/* Render current drawing path */}
            {isDrawing && tool === 'pen' && currentPath.length > 2 && (
              <Line
                key="temp-drawing-path"
                points={currentPath}
                stroke={color}
                strokeWidth={strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
              />
            )}

            {/* Render collaborator cursors */}
            {collaborators.map((collaborator, index) => (
              <Group key={collaborator.userId || collaborator.user?._id || `collaborator-${index}`}>
                <Circle
                  x={collaborator.cursor.x}
                  y={collaborator.cursor.y}
                  radius={4}
                  fill={collaborator.cursor.color || '#3b82f6'}
                />
                <Text
                  x={collaborator.cursor.x + 10}
                  y={collaborator.cursor.y - 20}
                  text={collaborator.userName || collaborator.user?.name || 'Anonymous'}
                  fontSize={12}
                  fill="#333"
                  backgroundColor="white"
                />
              </Group>
            ))}
          </Layer>
        </Stage>

        {/* Status Indicators */}
        <div className="absolute top-4 right-4 space-y-2">
          {/* Offline Indicator */}
          {isOffline && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Working Offline - Drawing Locally</span>
              </div>
            </div>
          )}
          
          {/* Online Indicator */}
          {!isOffline && hasTriedServer && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium">Connected to Server</span>
              </div>
            </div>
          )}
          
          {/* Online Collaborators */}
          {collaborators.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Online ({collaborators.length})</h4>
              <div className="space-y-1">
                {collaborators.map((collaborator, index) => (
                  <div key={collaborator.userId || collaborator.user?._id || `collaborator-list-${index}`} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: collaborator.cursor.color || '#3b82f6' }}
                    />
                    <span className="text-xs text-gray-600">{collaborator.userName || collaborator.user?.name || 'Anonymous'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeWhiteboard;