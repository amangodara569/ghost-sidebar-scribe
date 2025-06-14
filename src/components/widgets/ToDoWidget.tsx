
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Check, X } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ToDoWidgetProps {
  widgetId: string;
}

const ToDoWidget: React.FC<ToDoWidgetProps> = ({ widgetId }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      if (window.electronAPI) {
        const storedTodos = await window.electronAPI.invoke('todos:getAll');
        setTodos(storedTodos || []);
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  };

  const saveTodo = async (todo: Todo) => {
    try {
      if (window.electronAPI) {
        const savedTodo = await window.electronAPI.invoke('todos:save', todo);
        setTodos(prev => {
          const existing = prev.find(t => t.id === savedTodo.id);
          if (existing) {
            return prev.map(t => t.id === savedTodo.id ? savedTodo : t);
          }
          return [...prev, savedTodo];
        });
        return savedTodo;
      }
    } catch (error) {
      console.error('Failed to save todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('todos:delete', id);
        setTodos(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const addTodo = async () => {
    if (!newTodoTitle.trim()) return;

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title: newTodoTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTodo(newTodo);
    setNewTodoTitle('');
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      const updatedTodo = {
        ...todo,
        completed: !todo.completed,
        updatedAt: new Date().toISOString(),
      };
      await saveTodo(updatedTodo);
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const saveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;

    const todo = todos.find(t => t.id === editingId);
    if (todo) {
      const updatedTodo = {
        ...todo,
        title: editingTitle.trim(),
        updatedAt: new Date().toISOString(),
      };
      await saveTodo(updatedTodo);
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        addTodo();
      } else {
        saveEdit();
      }
    }
  };

  return (
    <Card className="bg-transparent border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-100">To-Do List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new todo */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'add')}
            placeholder="Add a new task..."
            className="flex-1 bg-gray-800 border-gray-600 text-gray-100 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={addTodo}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Todo list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todos.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p>No tasks yet. Add your first task above!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`
                  flex items-center gap-2 p-2 rounded border
                  ${todo.completed ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-800 border-gray-600'}
                `}
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center
                    ${todo.completed ? 'bg-green-600 border-green-600' : 'border-gray-500 hover:border-gray-400'}
                  `}
                >
                  {todo.completed && <Check className="w-3 h-3 text-white" />}
                </button>

                {editingId === todo.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'edit')}
                      className="flex-1 bg-gray-700 border-gray-600 text-gray-100 px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <Button onClick={saveEdit} size="sm" variant="ghost" className="p-1 h-auto">
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button onClick={cancelEdit} size="sm" variant="ghost" className="p-1 h-auto">
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`
                      flex-1 cursor-pointer text-gray-200
                      ${todo.completed ? 'line-through text-gray-400' : ''}
                    `}
                    onClick={() => startEditing(todo)}
                  >
                    {todo.title}
                  </div>
                )}

                {editingId !== todo.id && (
                  <Button
                    onClick={() => deleteTodo(todo.id)}
                    size="sm"
                    variant="ghost"
                    className="p-1 h-auto text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ToDoWidget;
