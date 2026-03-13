// src/pages/RegisterPage.jsx
// CUCEI MART — Pagina de registro | NEXCODE

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIAS } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIAS_EMP = CATEGORIAS.filter(c => c.value !== 'todos');

export default function RegisterPage() {
  const { registrarCliente, registrarEmprendedor } = useAuth();
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const [tipo, setTipo] = useState(params.get('tipo') || 'cliente');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep]         = useState(1); // Para emprendedor: 2 pasos

  // Formulario cliente
  const [clienteForm, setClienteForm] = useState({
    codigo_alumno: '', correo_udg: '', nombre: '',
    apellido_paterno: '', apellido_materno: '',
    nombre_usuario: '', contrasena: '', carrera: '', semestre: '',
  });

  // Formulario emprendedor
  const [empForm, setEmpForm] = useState({
    nombre: '', apellido_paterno: '', nombre_usuario: '',
    correo_contacto: '', contrasena: '', codigo_alumno: '',
    nombre_negocio: '', descripcion_corta: '', categoria_principal: '',
    whatsapp: '', instagram: '',
  });

  useEffect(() => {
    setStep(1);
  }, [tipo]);

  const updateCliente = (field, value) => setClienteForm(p => ({ ...p, [field]: value }));
  const updateEmp     = (field, value) => setEmpForm(p => ({ ...p, [field]: value }));

  const validateClienteStep = () => {
    const { codigo_alumno, correo_udg, nombre, apellido_paterno, nombre_usuario, contrasena } = clienteForm;
    if (!codigo_alumno || !correo_udg || !nombre || !apellido_paterno || !nombre_usuario || !contrasena) {
      toast.error('Completa todos los campos obligatorios'); return false;
    }
    if (!correo_udg.endsWith('@alumnos.udg.mx')) {
      toast.error('Debes usar tu correo @alumnos.udg.mx'); return false;
    }
    if (contrasena.length < 8) {
      toast.error('La contrasena debe tener minimo 8 caracteres'); return false;
    }
    return true;
  };

  const validateEmpStep1 = () => {
    const { nombre, apellido_paterno, nombre_usuario, correo_contacto, contrasena } = empForm;
    if (!nombre || !apellido_paterno || !nombre_usuario || !correo_contacto || !contrasena) {
      toast.error('Completa todos los campos obligatorios'); return false;
    }
    if (contrasena.length < 8) {
      toast.error('La contrasena debe tener minimo 8 caracteres'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tipo === 'emprendedor' && step === 1) {
      if (validateEmpStep1()) setStep(2);
      return;
    }

    if (tipo === 'cliente' && !validateClienteStep()) return;

    if (tipo === 'emprendedor') {
      if (!empForm.nombre_negocio || !empForm.categoria_principal) {
        toast.error('El nombre del negocio y la categoria son requeridos');
        return;
      }
    }

    setLoading(true);
    try {
      if (tipo === 'cliente') {
        await registrarCliente({
          ...clienteForm,
          semestre: clienteForm.semestre ? parseInt(clienteForm.semestre) : undefined,
        });
        toast.success('Cuenta creada exitosamente');
        navigate('/', { replace: true });
      } else {
        await registrarEmprendedor(empForm);
        toast.success('Emprendimiento registrado');
        navigate('/panel', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear la cuenta';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, id, type = 'text', value, onChange, placeholder, required = true, hint }) => (
    <div>
      <label htmlFor={id} className="input-label">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
        required={required}
      />
      {hint && <p className="text-xs text-text-subtle mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 gradient-cucei rounded-xl flex items-center justify-center shadow-card">
              <i className="fa-solid fa-atom text-white text-sm" />
            </div>
            <span className="font-heading font-bold text-text text-xl">
              CUCEI<span className="text-primary"> MART</span>
            </span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-text mb-1">
            {tipo === 'cliente' ? 'Crear cuenta' : 'Registrar emprendimiento'}
          </h1>
          <p className="text-text-muted text-sm">
            {tipo === 'cliente'
              ? 'Accede a todos los emprendimientos de CUCEI'
              : 'Lleva tu negocio a la plataforma universitaria'}
          </p>
        </div>

        {/* Tipo selector */}
        <div className="flex bg-white rounded-xl p-1 mb-6 border border-surface-dark shadow-card">
          {[
            { id: 'cliente',     label: 'Soy alumno',      icon: 'fa-graduation-cap' },
            { id: 'emprendedor', label: 'Soy emprendedor', icon: 'fa-store' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipo(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold
                          transition-all duration-200 select-none
                ${tipo === t.id
                  ? 'gradient-cucei text-white shadow-card'
                  : 'text-text-muted hover:text-text'
                }`}
            >
              <i className={`fa-solid ${t.icon} text-xs`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Progress (solo emprendedor) */}
        {tipo === 'emprendedor' && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300
                  ${step >= s ? 'bg-primary text-white' : 'bg-surface-dark text-text-muted'}`}>
                  {step > s ? <i className="fa-solid fa-check text-[10px]" /> : s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? 'text-primary' : 'text-text-muted'}`}>
                  {s === 1 ? 'Datos personales' : 'Tu negocio'}
                </span>
                {s < 2 && <div className={`flex-1 h-0.5 rounded transition-all ${step > s ? 'bg-primary' : 'bg-surface-dark'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Card formulario */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ─── CLIENTE ─────────────────────────────────── */}
            {tipo === 'cliente' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Nombre" id="nombre"
                    value={clienteForm.nombre}
                    onChange={v => updateCliente('nombre', v)}
                    placeholder="Ana"
                  />
                  <InputField
                    label="Apellido paterno" id="apellido_paterno"
                    value={clienteForm.apellido_paterno}
                    onChange={v => updateCliente('apellido_paterno', v)}
                    placeholder="Martinez"
                  />
                </div>
                <InputField
                  label="Codigo de alumno" id="codigo_alumno"
                  value={clienteForm.codigo_alumno}
                  onChange={v => updateCliente('codigo_alumno', v)}
                  placeholder="218001234"
                  hint="Tu codigo UDG de 6-10 digitos"
                />
                <InputField
                  label="Correo institucional" id="correo_udg"
                  type="email"
                  value={clienteForm.correo_udg}
                  onChange={v => updateCliente('correo_udg', v)}
                  placeholder="218001234@alumnos.udg.mx"
                />
                <InputField
                  label="Nombre de usuario" id="nombre_usuario"
                  value={clienteForm.nombre_usuario}
                  onChange={v => updateCliente('nombre_usuario', v.toLowerCase().replace(/\s/g, '_'))}
                  placeholder="ana_cucei"
                  hint="Solo letras, numeros y guion bajo"
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Carrera" id="carrera"
                    value={clienteForm.carrera}
                    onChange={v => updateCliente('carrera', v)}
                    placeholder="Ing. Computacion"
                    required={false}
                  />
                  <InputField
                    label="Semestre" id="semestre"
                    type="number"
                    value={clienteForm.semestre}
                    onChange={v => updateCliente('semestre', v)}
                    placeholder="1-15"
                    required={false}
                  />
                </div>
                <div>
                  <label htmlFor="pass" className="input-label">
                    Contrasena <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="pass" type={showPass ? 'text' : 'password'}
                      value={clienteForm.contrasena}
                      onChange={e => updateCliente('contrasena', e.target.value)}
                      placeholder="Minimo 8 caracteres"
                      className="input-field pr-11" required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-subtle hover:text-text">
                      <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ─── EMPRENDEDOR PASO 1 ───────────────────────── */}
            {tipo === 'emprendedor' && step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Nombre" id="nombre"
                    value={empForm.nombre}
                    onChange={v => updateEmp('nombre', v)}
                    placeholder="Demian"
                  />
                  <InputField
                    label="Apellido paterno" id="ape"
                    value={empForm.apellido_paterno}
                    onChange={v => updateEmp('apellido_paterno', v)}
                    placeholder="Fernandez"
                  />
                </div>
                <InputField
                  label="Usuario" id="usuario_emp"
                  value={empForm.nombre_usuario}
                  onChange={v => updateEmp('nombre_usuario', v.toLowerCase().replace(/\s/g, '_'))}
                  placeholder="mi_negocio"
                />
                <InputField
                  label="Correo de contacto" id="correo_emp"
                  type="email"
                  value={empForm.correo_contacto}
                  onChange={v => updateEmp('correo_contacto', v)}
                  placeholder="minegocio@gmail.com"
                  hint="Este correo sera visible para tus clientes"
                />
                <InputField
                  label="Codigo de alumno (opcional)" id="codigo_emp"
                  value={empForm.codigo_alumno}
                  onChange={v => updateEmp('codigo_alumno', v)}
                  placeholder="218001234"
                  required={false}
                />
                <div>
                  <label htmlFor="pass_emp" className="input-label">
                    Contrasena <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="pass_emp" type={showPass ? 'text' : 'password'}
                      value={empForm.contrasena}
                      onChange={e => updateEmp('contrasena', e.target.value)}
                      placeholder="Minimo 8 caracteres"
                      className="input-field pr-11" required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-subtle hover:text-text">
                      <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ─── EMPRENDEDOR PASO 2 ───────────────────────── */}
            {tipo === 'emprendedor' && step === 2 && (
              <>
                <InputField
                  label="Nombre del negocio" id="nombre_negocio"
                  value={empForm.nombre_negocio}
                  onChange={v => updateEmp('nombre_negocio', v)}
                  placeholder="Ej: SANZA ART"
                />
                <div>
                  <label htmlFor="cat" className="input-label">
                    Categoria principal <span className="text-accent">*</span>
                  </label>
                  <select
                    id="cat"
                    value={empForm.categoria_principal}
                    onChange={e => updateEmp('categoria_principal', e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Selecciona una categoria...</option>
                    {CATEGORIAS_EMP.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="desc" className="input-label">
                    Descripcion corta <span className="text-text-subtle font-normal">(opcional)</span>
                  </label>
                  <textarea
                    id="desc"
                    value={empForm.descripcion_corta}
                    onChange={e => updateEmp('descripcion_corta', e.target.value)}
                    placeholder="Describe tu emprendimiento en una linea..."
                    rows={2}
                    maxLength={280}
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-text-subtle mt-1 text-right">
                    {empForm.descripcion_corta.length}/280
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="WhatsApp" id="wp"
                    value={empForm.whatsapp}
                    onChange={v => updateEmp('whatsapp', v)}
                    placeholder="523312345678"
                    required={false}
                    hint="Con codigo de pais, sin espacios"
                  />
                  <InputField
                    label="Instagram" id="ig"
                    value={empForm.instagram}
                    onChange={v => updateEmp('instagram', v)}
                    placeholder="https://instagram.com/..."
                    required={false}
                  />
                </div>
              </>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              {tipo === 'emprendedor' && step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  <i className="fa-solid fa-arrow-left text-xs" />
                  Atras
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 justify-center py-3.5"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    Procesando...
                  </>
                ) : tipo === 'emprendedor' && step === 1 ? (
                  <>
                    Continuar
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-rocket text-xs" />
                    {tipo === 'cliente' ? 'Crear mi cuenta' : 'Registrar negocio'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Link a login */}
        <p className="text-center text-sm text-text-muted mt-6">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
