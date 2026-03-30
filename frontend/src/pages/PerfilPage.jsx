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
        checked ? 'bg-drogamais-500' : 'bg-gray-200'
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
        initialForm[`${prefix}_abre`] = data[`${prefix}_abre`] ?? '';
        initialForm[`${prefix}_fecha`] = data[`${prefix}_fecha`] ?? '';
        initialForm[`is_${prefix}_aberto`] = !!(data[`${prefix}_abre`] && data[`${prefix}_fecha`]);
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

  if (loading) return <p className="text-gray-500 text-sm">A carregar perfil...</p>;

  return (
    <div className="max-w-4xl pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Perfil da Loja</h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <Building2 size={16} /> 
          CNPJ: <span className="font-mono">{perfil?.cnpj}</span>
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
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Building2 className="text-gray-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-700">Informações Básicas</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Nome Fantasia</label>
              <input type="text" name="nome_fantasia" value={form.nome_fantasia ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Razão Social</label>
              <input type="text" name="razao_social" value={form.razao_social ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
          </div>
        </section>

        {/* CONTATOS */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Smartphone className="text-gray-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-700">Contactos da Loja</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Telefone</label>
              <input type="text" name="telefone" placeholder="(XX) XXXXX-XXXX" value={form.telefone ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">WhatsApp</label>
              <input type="text" name="whatsapp" placeholder="(XX) XXXXX-XXXX" value={form.whatsapp ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Instagram</label>
              <input type="text" name="instagram" placeholder="@drogamais" value={form.instagram ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
          </div>
        </section>

        {/* ENDEREÇO */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <MapPin className="text-gray-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-700">Morada / Endereço</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-6 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">CEP</label>
              <input type="text" name="end_cep" value={form.end_cep ?? ''} onChange={handleChange} placeholder="00000-000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Rua / Logradouro</label>
              <input type="text" name="end_rua" value={form.end_rua ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Número</label>
              <input type="text" name="end_numero" value={form.end_numero ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Complemento</label>
              <input type="text" name="end_complemento" value={form.end_complemento ?? ''} onChange={handleChange} placeholder="Sala, Andar, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Bairro</label>
              <input type="text" name="end_bairro" value={form.end_bairro ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Cidade</label>
              <input type="text" name="end_cidade" value={form.end_cidade ?? ''} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500" />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">UF</label>
              <input type="text" name="end_uf" value={form.end_uf ?? ''} onChange={handleChange} maxLength="2" placeholder="SP" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-drogamais-500 uppercase" />
            </div>
          </div>
        </section>

        {/* HORÁRIOS */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-gray-500" size={20} />
              <h2 className="text-lg font-semibold text-gray-700">Horário de Funcionamento</h2>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {DIAS_SEMANA.map(({ prefix, label }) => {
              const isOpen = form[`is_${prefix}_aberto`];
              const abre = parseTime(form[`${prefix}_abre`]);
              const fecha = parseTime(form[`${prefix}_fecha`]);

              return (
                <div key={prefix} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between sm:w-48 shrink-0">
                    <span className="font-medium text-gray-700">{label}</span>
                    <Switch 
                      checked={isOpen} 
                      onChange={(val) => setForm({ ...form, [`is_${prefix}_aberto`]: val })} 
                    />
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    {!isOpen ? (
                      <span className="text-gray-400 font-medium text-sm bg-gray-100 px-3 py-1.5 rounded-md">Fechado</span>
                    ) : (
                      <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 w-full">
                        {/* ABERTURA */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1 select-none">Abre</span>
                          <select value={abre.h} onChange={(e) => handleTimeChange(prefix, 'abre', 'h', e.target.value)} className="appearance-none bg-transparent text-sm focus:outline-none font-medium text-gray-700 cursor-pointer">
                            <option value="" disabled>--</option>
                            {horas.map(h => <option key={`h-${h}`} value={h}>{h}</option>)}
                          </select>
                          <span className="text-gray-400 select-none">:</span>
                          <select value={abre.m} onChange={(e) => handleTimeChange(prefix, 'abre', 'm', e.target.value)} className="appearance-none bg-transparent text-sm focus:outline-none font-medium text-gray-700 cursor-pointer">
                            <option value="" disabled>--</option>
                            {minutos.map(m => <option key={`m-${m}`} value={m}>{m}</option>)}
                          </select>
                        </div>
                        
                        <span className="text-gray-300 font-medium text-sm">até</span>

                        {/* FECHAMENTO */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1 select-none">Fecha</span>
                          <select value={fecha.h} onChange={(e) => handleTimeChange(prefix, 'fecha', 'h', e.target.value)} className="appearance-none bg-transparent text-sm focus:outline-none font-medium text-gray-700 cursor-pointer">
                            <option value="" disabled>--</option>
                            {horas.map(h => <option key={`h-${h}`} value={h}>{h}</option>)}
                          </select>
                          <span className="text-gray-400 select-none">:</span>
                          <select value={fecha.m} onChange={(e) => handleTimeChange(prefix, 'fecha', 'm', e.target.value)} className="appearance-none bg-transparent text-sm focus:outline-none font-medium text-gray-700 cursor-pointer">
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
