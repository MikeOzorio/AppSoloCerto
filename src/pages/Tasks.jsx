import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Check, Clock, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import './Tasks.css';

export default function Tasks() {
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchTasks();
    }
  }, [isAuthenticated, user?.id]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });
    
    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate,
        completed: false
      })
      .select()
      .single();

    if (!error && data) {
      setTasks([...tasks, data].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
      setTitle('');
      setDescription('');
      setDueDate('');
    } else {
      alert('Erro ao adicionar tarefa.');
    }
  };

  const toggleTask = async (task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .eq('user_id', user.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !task.completed } : t));
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta tarefa?')) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const isLate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString + 'T00:00:00');
    return taskDate < today;
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="tasks-page container animate-fade-in">
      <div className="tasks-header">
        <div>
          <h2>Tarefas e Operações</h2>
          <p className="text-muted">Gerencie as atividades da sua propriedade rural.</p>
        </div>
      </div>

      <div className="tasks-content">
        <div className="tasks-form card">
          <h3>Nova Tarefa</h3>
          <form onSubmit={handleAddTask} className="add-task-form">
            <div className="input-group">
              <label>O que precisa ser feito?</label>
              <input 
                type="text" 
                className="input" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Pulverização talhão 1"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Data de Vencimento</label>
              <input 
                type="date" 
                className="input" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                required
              />
            </div>

            <div className="input-group">
              <label>Descrição (opcional)</label>
              <textarea 
                className="input" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Detalhes adicionais da operação..."
                rows={3}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={!title.trim() || !dueDate}>
              <Plus size={16} /> Adicionar Tarefa
            </button>
          </form>
        </div>

        <div className="tasks-list-container">
          {loading ? (
            <div className="card"><p>Carregando tarefas...</p></div>
          ) : (
            <>
              <div className="tasks-section">
                <h3 className="section-title"><Clock size={18} /> Pendentes ({pendingTasks.length})</h3>
                {pendingTasks.length === 0 ? (
                  <p className="text-muted card">Nenhuma tarefa pendente.</p>
                ) : (
                  <div className="tasks-grid">
                    {pendingTasks.map(task => (
                      <div key={task.id} className={`task-card card ${isLate(task.due_date) ? 'late' : ''}`}>
                        <div className="task-info">
                          <h4>{task.title}</h4>
                          {task.description && <p className="task-desc">{task.description}</p>}
                          <div className={`task-meta ${isLate(task.due_date) ? 'text-danger' : 'text-muted'}`}>
                            <Calendar size={14} /> 
                            {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            {isLate(task.due_date) && <span className="late-badge"><AlertCircle size={12}/> Atrasada</span>}
                          </div>
                        </div>
                        <div className="task-actions">
                          <button className="btn-icon check-btn" onClick={() => toggleTask(task)} title="Concluir">
                            <Check size={20} />
                          </button>
                          <button className="btn-icon delete-btn" onClick={() => deleteTask(task.id)} title="Excluir">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {completedTasks.length > 0 && (
                <div className="tasks-section completed-section">
                  <h3 className="section-title"><Check size={18} /> Concluídas ({completedTasks.length})</h3>
                  <div className="tasks-grid">
                    {completedTasks.map(task => (
                      <div key={task.id} className="task-card card completed">
                        <div className="task-info">
                          <h4>{task.title}</h4>
                          <div className="task-meta text-muted">
                            <Calendar size={14} /> 
                            {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="task-actions">
                          <button className="btn-icon undo-btn" onClick={() => toggleTask(task)} title="Desfazer">
                            <Clock size={18} />
                          </button>
                          <button className="btn-icon delete-btn" onClick={() => deleteTask(task.id)} title="Excluir">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
