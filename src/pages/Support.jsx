import React, { useState } from 'react';
import { HeadphonesIcon, Mail, Phone, MessageCircle, Send, CheckCircle2, MapPin, Clock } from 'lucide-react';
import './Support.css';

export default function Support() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    // Simulate sending
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="support-page container animate-fade-in">
      <div className="support-header">
        <h2>Suporte e Contato Profissional</h2>
        <p className="text-muted">Precisa de ajuda técnica ou consultoria agronômica? Estamos aqui para você.</p>
      </div>

      <div className="support-grid">
        {/* Contact Cards */}
        <div className="support-contacts">
          <div className="contact-card card">
            <div className="contact-icon" style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25d366' }}>
              <MessageCircle size={28} />
            </div>
            <h3>WhatsApp</h3>
            <p className="text-muted">Fale diretamente com nosso Engenheiro Agrônomo pelo WhatsApp.</p>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ backgroundColor: '#25d366', width: '100%' }}>
              Chamar no WhatsApp
            </a>
          </div>

          <div className="contact-card card">
            <div className="contact-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Mail size={28} />
            </div>
            <h3>E-mail</h3>
            <p className="text-muted">Envie um e-mail para nosso suporte técnico.</p>
            <a href="mailto:suporte@coffeti.com" className="btn btn-secondary" style={{ width: '100%' }}>
              suporte@coffeti.com
            </a>
          </div>

          <div className="contact-card card">
            <div className="contact-icon" style={{ backgroundColor: 'rgba(139, 90, 43, 0.1)', color: 'var(--color-primary)' }}>
              <Phone size={28} />
            </div>
            <h3>Telefone</h3>
            <p className="text-muted">Ligue diretamente para nossa central de atendimento.</p>
            <a href="tel:+550000000000" className="btn btn-secondary" style={{ width: '100%' }}>
              (00) 0000-0000
            </a>
          </div>

          <div className="contact-card card">
            <div className="contact-icon" style={{ backgroundColor: 'rgba(46, 139, 87, 0.1)', color: 'var(--color-accent)' }}>
              <Clock size={28} />
            </div>
            <h3>Horário de Atendimento</h3>
            <p className="text-muted">Segunda a Sexta, das 08h às 18h.</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Sábado: 08h às 12h</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="support-form-area card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Send size={20} /> Enviar uma Mensagem
          </h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Preencha o formulário abaixo e retornaremos em até 24 horas úteis.
          </p>

          {sent ? (
            <div className="support-success animate-fade-in">
              <CheckCircle2 size={48} />
              <h3>Mensagem enviada!</h3>
              <p className="text-muted">Obrigado pelo contato. Retornaremos em breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="support-form">
              <div className="input-group">
                <label>Seu Nome</label>
                <input type="text" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Ex: João Silva" />
              </div>
              <div className="input-group">
                <label>Seu E-mail</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="Ex: joao@email.com" />
              </div>
              <div className="input-group">
                <label>Assunto</label>
                <select className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                  <option value="">Selecione um assunto...</option>
                  <option value="tecnico">Suporte Técnico</option>
                  <option value="agronomico">Consultoria Agronômica</option>
                  <option value="assinatura">Dúvida sobre Assinatura</option>
                  <option value="bug">Relatar um Problema</option>
                  <option value="sugestao">Sugestão de Melhoria</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="input-group">
                <label>Mensagem</label>
                <textarea className="input support-textarea" value={form.message} onChange={e => setForm({...form, message: e.target.value})} required placeholder="Descreva sua dúvida ou solicitação..." rows={5} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={16} /> Enviar Mensagem
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
