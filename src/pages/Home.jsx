import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, FileText, Settings, Sprout, Tractor, ChevronRight, ChevronLeft } from 'lucide-react';
import './Home.css';

const ADS = [
  {
    id: 1,
    image: '/fertilizer_ad.png',
    title: 'Fertimax Premium',
    subtitle: 'A nutrição que o seu Conilon merece. Maior produtividade e resistência.',
    link: '#'
  },
  {
    id: 2,
    image: '/tractor_ad.png',
    title: 'Nova Linha de Tratores Tech',
    subtitle: 'Potência e tecnologia para revolucionar o seu manejo na lavoura.',
    link: '#'
  }
];

export default function Home() {
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ADS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextAd = () => setCurrentAd((prev) => (prev + 1) % ADS.length);
  const prevAd = () => setCurrentAd((prev) => (prev === 0 ? ADS.length - 1 : prev - 1));

  return (
    <div className="home-page animate-fade-in">
      <div className="home-top-section container">
        
        {/* Left Side: Main Hero */}
        <div className="hero-content glass-panel">
          <h1 className="hero-title">CoffeTI - Beta<br/>Gestão Inteligente do Solo para Café Conilon</h1>
          <p className="hero-subtitle">
            Otimize a adubação e a produtividade da sua lavoura de Conilon. 
            Faça a leitura automática dos laudos de análise de solo em segundos e acompanhe a evolução da fertilidade.
          </p>
          <div className="hero-actions">
            <Link to="/analysis" className="btn btn-primary">
              <FileText size={20} /> Nova Análise
            </Link>
            <Link to="/settings" className="btn btn-secondary">
              <Settings size={20} /> Parametrizar Limites
            </Link>
          </div>
        </div>

        {/* Right Side: Marketing Carousel */}
        <div className="marketing-carousel">
          {ADS.map((ad, index) => (
            <div 
              key={ad.id} 
              className={`marketing-slide ${index === currentAd ? 'active' : ''}`}
              style={{ backgroundImage: `url(${ad.image})` }}
            >
              <div className="marketing-overlay">
                <span className="ad-badge">Parceiro Oficial</span>
                <h3>{ad.title}</h3>
                <p>{ad.subtitle}</p>
                <a href={ad.link} className="btn-text" style={{ color: 'white' }}>Saiba Mais <ChevronRight size={16} /></a>
              </div>
            </div>
          ))}
          <div className="carousel-controls">
            <button className="carousel-btn" onClick={prevAd}><ChevronLeft size={20} /></button>
            <div className="carousel-indicators">
              {ADS.map((_, index) => (
                <div key={index} className={`indicator ${index === currentAd ? 'active' : ''}`} onClick={() => setCurrentAd(index)} />
              ))}
            </div>
            <button className="carousel-btn" onClick={nextAd}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <section className="features container">
        <h2 className="section-title">Por que usar o nosso sistema?</h2>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon">
              <Tractor size={40} />
            </div>
            <h3>Foco no Produtor</h3>
            <p>Pensado para a realidade do campo. Organize os talhões, acompanhe o histórico e garanta a melhor nutrição para a sua safra de café.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">
              <FileText size={40} />
            </div>
            <h3>Leitura Automática de PDF</h3>
            <p>Não perca mais tempo digitando resultados. Nossa IA lê os laudos dos principais laboratórios automaticamente.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">
              <Sprout size={40} />
            </div>
            <h3>Parâmetros Customizáveis</h3>
            <p>Cada região tem sua exigência. Ajuste as faixas de fertilidade (Baixo, Médio, Adequado) de acordo com o manual agronômico do seu estado.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
