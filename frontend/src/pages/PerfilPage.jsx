import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { Clock, MapPin, Building2, Smartphone, Save } from 'lucide-react'

const formatPhone = (val) => {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  
  const isMobile = digits.length === 11;
  const splitAt = isMobile ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, splitAt)}-${digits.slice(splitAt)}`;
};

const DIAS_SEMANA = [
  { prefix: 'seg', label: 'Segunda-feira' },
  { prefix: 'ter', label: 'Terça-feira' },
  { prefix: 'qua', label: 'Quarta-feira' },
  { prefix: 'qui', label: 'Quinta-feira' },
  { prefix: 'sex', label: 'Sexta-feira' },
  { prefix: 'sab', label: 'Sábado' },
  { prefix: 'dom', label: 'Domingo' },
];

const horas = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutos = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

// Custom Switch component
function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-drogamais-500 focus:ring-offset-2 ${
        checked ? 'bg-drogamais-500' : 'bg-gray-200 dark:bg-slate-700'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function PerfilPage() {
  const [perfil, setPerfil]   = useState(null)
  const [form, setForm]       = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)

  useEffect(() => {
    api.get('/api/loja/perfil').then(({ data }) => {
      setPerfil(data)
      const initialForm = {
        nome_fantasia:   data.nome_fantasia ?? '',
        razao_social:    data.razao_social  ?? '',
        telefone:        formatPhone(data.telefone) ?? '',
        whatsapp:        formatPhone(data.whatsapp) ?? '',
        instagram:       data.instagram     ?? '',
        end_rua:         data.end_rua ?? '',
        end_numero:      data.end_numero ?? '',
        end_bairro:      data.end_bairro ?? '',
        end_cidade:      data.end_cidade ?? '',
        end_uf:          data.end_uf ?? '',
        end_cep:         data.end_cep ?? '',
        end_complemento: data.end_complemento ?? '',
      };

      // Injeta os horários
      DIAS_SEMANA.forEach(({ prefix }) => {
        const abre = data[`${prefix}_abre`] ?? '';
        const fecha = data[`${prefix}_fecha`] ?? '';
        initialForm[`${prefix}_abre`] = abre;
        initialForm[`${prefix}_fecha`] = fecha;
        initialForm[`is_${prefix}_aberto`] = !!(abre && fecha);
        initialForm[`is_${prefix}_24h`] = (abre === '00:00' && (fecha === '23:59' || fecha === '00:00'));
      });

      setForm(initialForm)
    }).finally(() => setLoading(false))
  }, [])

  function parseTime(val) {
    if (!val) return { h: '', m: '' };
    const [h, m] = val.split(':');
    return { h: h || '', m: m || '' };
  }

  function handleTimeChange(prefix, type, field, val) {
    const current = parseTime(form[`${prefix}_${type}`]);
    const updated = { ...current, [field]: val };
    
    // Se ambos hora e minuto estiverem preenchidos, formata. Senão, fica vazio.
    let newVal = '';
    if (updated.h && updated.m) {
      newVal = `${updated.h}:${updated.m}`;
    } else if (updated.h) {
      // Se apenas hora foi preenchida, assume minuto 00 preventivamente (UX)
      newVal = `${updated.h}:00`;
    }

    setForm(prev => ({ ...prev, [`${prefix}_${type}`]: newVal }));
  }

  function toggle24h(prefix) {
    const isNow24h = !form[`is_${prefix}_24h`];
    setForm(prev => ({
      ...prev,
      [`is_${prefix}_24h`]: isNow24h,
      [`is_${prefix}_aberto`]: true, // Força estar aberto
      [`${prefix}_abre`]: isNow24h ? '00:00' : (prev[`${prefix}_abre`] === '00:00' ? '' : prev[`${prefix}_abre`]),
      [`${prefix}_fecha`]: isNow24h ? '23:59' : (prev[`${prefix}_fecha`] === '23:59' ? '' : prev[`${prefix}_fecha`]),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg(null)

    // Validação Frontend: Horário de Fechamento não pode ser anterior à Abertura
    for (const { prefix, label } of DIAS_SEMANA) {
      if (form[`is_${prefix}_aberto`]) {
        const abre = form[`${prefix}_abre`];
        const fecha = form[`${prefix}_fecha`];
        if (!abre || !fecha) {
          setMsg({ type: 'error', text: `Preencha os horários completos para ${label}.` });
          window.scrollTo(0, 0);
          return;
        }
        if (fecha <= abre) {
          setMsg({ type: 'error', text: `O horário de fechamento (${fecha}) não pode ser anterior à abertura (${abre}) na ${label}.` });
          window.scrollTo(0, 0);
          return;
        }
      }
    }

    setSaving(true)
    
    const submitData = {
      ...form,
      telefone: form.telefone?.replace(/\D/g, ''),
      whatsapp: form.whatsapp?.replace(/\D/g, '')
    }

    // Limpa estado isolado (Variáveis de controle do front) e envia null para dias Fechados
    DIAS_SEMANA.forEach(({ prefix }) => {
      delete submitData[`is_${prefix}_aberto`];
      delete submitData[`is_${prefix}_24h`];
      if (!form[`is_${prefix}_aberto`]) {
        submitData[`${prefix}_abre`] = null;
        submitData[`${prefix}_fecha`] = null;
      }
    });

    try {
      const { data } = await api.put('/api/loja/perfil', submitData)
      setPerfil(data)
      setMsg({ type: 'success', text: 'Perfil e horários guardados com sucesso!' })
      window.scrollTo(0, 0);
    } catch (err) {
      const detail = err.response?.data?.error;
      const errorMsg = typeof detail === 'string' ? detail : 
                       (Array.isArray(detail) ? detail.map(e => e.message).join(', ') : 'Erro ao guardar.');
      setMsg({ type: 'error', text: errorMsg })
      window.scrollTo(0, 0);
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefone' || name === 'whatsapp') {
      setForm({ ...form, [name]: formatPhone(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  if (loading) return <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">A carregar perfil...</p>;

  return (
    <div className="max-w-3xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Perfil da Loja</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
          <Building2 size={16} className="text-drogamais-500" /> 
          CNPJ: <span className="font-mono font-bold">{perfil?.cnpj}</span>
          {perfil?.loja_numero && ` • Loja nº ${perfil.loja_numero}`}
        </p>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
            msg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* INFORMAÇÕES BÁSICAS */}
        <section className="bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-800/40 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Building2 className="text-slate-400 dark:text-slate-500" size={20} />
            <h2 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Informações Básicas</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Fantasia</label>
              <input type="text" name="nome_fantasia" value={form.nome_fantasia ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20 focus:border-drogamais-400" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Razão Social</label>
              <input type="text" name="razao_social" value={form.razao_social ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20 focus:border-drogamais-400" />
            </div>
          </div>
        </section>

        {/* CONTATOS */}
        <section className="bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-800/40 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Smartphone className="text-slate-400 dark:text-slate-500" size={20} />
            <h2 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Contactos da Loja</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
              <input type="text" name="telefone" placeholder="(XX) XXXXX-XXXX" value={form.telefone ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
              <input type="text" name="whatsapp" placeholder="(XX) XXXXX-XXXX" value={form.whatsapp ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20 font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Instagram</label>
              <input type="text" name="instagram" placeholder="@drogamais" value={form.instagram ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20" />
            </div>
          </div>
        </section>

        {/* ENDEREÇO */}
        <section className="bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-800/40 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <MapPin className="text-slate-400 dark:text-slate-500" size={20} />
            <h2 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Morada / Endereço</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-6 gap-5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">CEP</label>
              <input type="text" name="end_cep" value={form.end_cep ?? ''} onChange={handleChange} placeholder="00000-000" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20" />
            </div>
            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Rua / Logradouro</label>
              <input type="text" name="end_rua" value={form.end_rua ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Número</label>
              <input type="text" name="end_numero" value={form.end_numero ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20" />
            </div>
            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Complemento</label>
              <input type="text" name="end_complemento" value={form.end_complemento ?? ''} onChange={handleChange} placeholder="Sala, Andar, etc." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Bairro</label>
              <input type="text" name="end_bairro" value={form.end_bairro ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20" />
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Cidade</label>
              <input type="text" name="end_cidade" value={form.end_cidade ?? ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20" />
            </div>
            <div className="sm:col-span-1 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">UF</label>
              <input type="text" name="end_uf" value={form.end_uf ?? ''} onChange={handleChange} maxLength="2" placeholder="SP" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-sm hover:shadow-md focus:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-drogamais-500/20 uppercase text-center" />
            </div>
          </div>
        </section>

        {/* HORÁRIOS */}
        <section className="bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-800/40 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-slate-400 dark:text-slate-500" size={20} />
              <h2 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Horário de Funcionamento</h2>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {DIAS_SEMANA.map(({ prefix, label }) => {
              const isOpen = form[`is_${prefix}_aberto`];
              const abre = parseTime(form[`${prefix}_abre`]);
              const fecha = parseTime(form[`${prefix}_fecha`]);

              return (
                <div key={prefix} className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${isOpen ? 'bg-white dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                  <div className="flex items-center justify-between sm:w-64 shrink-0">
                    <span className="font-bold text-[14px] text-slate-700 dark:text-slate-300 tracking-tight w-24">{label}</span>
                    
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => toggle24h(prefix)}
                        className={`text-[10px] font-black px-2 py-1 rounded-md border transition-all ${
                          form[`is_${prefix}_24h`] 
                            ? 'bg-drogamais-500 text-white border-drogamais-600 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        24h
                      </button>

                      <Switch 
                        checked={isOpen} 
                        onChange={(val) => setForm({ ...form, [`is_${prefix}_aberto`]: val, [`is_${prefix}_24h`]: val ? form[`is_${prefix}_24h`] : false })} 
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    {!isOpen ? (
                      <span className="text-[11px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">Fechado</span>
                    ) : (
                      <div className={`flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 w-full ${form[`is_${prefix}_24h`] ? 'opacity-50 pointer-events-none' : ''}`}>
                        {/* ABERTURA */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1 select-none">Abre</span>
                          <select 
                            disabled={form[`is_${prefix}_24h`]}
                            value={abre.h} 
                            onChange={(e) => handleTimeChange(prefix, 'abre', 'h', e.target.value)} 
                            className="appearance-none bg-transparent text-sm focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer px-1 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>--</option>
                            {horas.map(h => <option key={`h-${h}`} value={h}>{h}</option>)}
                          </select>
                          <span className="text-slate-300 dark:text-slate-600 select-none font-bold">:</span>
                          <select 
                            disabled={form[`is_${prefix}_24h`]}
                            value={abre.m} 
                            onChange={(e) => handleTimeChange(prefix, 'abre', 'm', e.target.value)} 
                            className="appearance-none bg-transparent text-sm focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer px-1 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>--</option>
                            {minutos.map(m => <option key={`m-${m}`} value={m}>{m}</option>)}
                          </select>
                        </div>
                        
                        <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">até</span>

                        {/* FECHAMENTO */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-1 select-none">Fecha</span>
                          <select 
                            disabled={form[`is_${prefix}_24h`]}
                            value={fecha.h} 
                            onChange={(e) => handleTimeChange(prefix, 'fecha', 'h', e.target.value)} 
                            className="appearance-none bg-transparent text-sm focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer px-1 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>--</option>
                            {horas.map(h => <option key={`h-${h}`} value={h}>{h}</option>)}
                          </select>
                          <span className="text-slate-300 dark:text-slate-600 select-none font-bold">:</span>
                          <select 
                            disabled={form[`is_${prefix}_24h`]}
                            value={fecha.m} 
                            onChange={(e) => handleTimeChange(prefix, 'fecha', 'm', e.target.value)} 
                            className="appearance-none bg-transparent text-sm focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer px-1 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>--</option>
                            {minutos.map(m => <option key={`m-${m}`} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-drogamais-500 hover:bg-drogamais-600 text-white text-sm font-semibold px-8 py-3 rounded-xl transition-all disabled:opacity-60 shadow-md shadow-drogamais-500/20"
          >
            <Save size={18} />
            {saving ? 'A guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
