import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { PrestadorTipo, DireccionAtencion, DiaSemana } from "../model/Provider.model";
import { specialtiesAPI, providersAPI } from "../services/api";
import { ButtonVolver } from "../util/ButtonVolver";

type BloqueHorario = { dias: DiaSemana[]; desde: string; hasta: string };
type Especialidad = { id: string; nombre: string };

export function AddProvider() {
  const navigate = useNavigate();

  // --- Estados generales ---
  const [tipo, setTipo] = useState<PrestadorTipo | "">("");
  const [cuilCuit, setCuilCuit] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [especialidades, setEspecialidades] = useState<string[]>([""]);
  const [telefonos, setTelefonos] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [direcciones, setDirecciones] = useState<DireccionAtencion[]>([
    { calle: "", numero: "", localidad: "", provincia: "", cp: "", horarios: [{ dias: [], desde: "", hasta: "" }] as unknown as BloqueHorario[] },
  ]);

  const [centros, setCentros] = useState<any[]>([]);
  const [integraCentro, setIntegraCentro] = useState<string>("");
  
  const [error, setError] = useState("");
  const [availableEspecialidades, setAvailableEspecialidades] = useState<Especialidad[]>([]);

  // Cargar especialidades y centros médicos desde la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [especialidadesData, prestadoresData] = await Promise.all([
          specialtiesAPI.getAll(),
          providersAPI.getAll()
        ]);
        console.log('📚 Especialidades cargadas:', especialidadesData);
        // El backend devuelve { idEspecialidad, nombre }, no { id, nombre }
        setAvailableEspecialidades(especialidadesData.map((e: any) => ({
          id: String(e.idEspecialidad || e.id),
          nombre: e.nombre
        })));
        setCentros(prestadoresData.filter(p => p.tipo === "centro"));
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchData();
  }, []);


  const handleAgregarTelefono = () => setTelefonos([...telefonos, ""]);
  const handleEliminarTelefono = (index: number) =>
    setTelefonos(telefonos.filter((_, i) => i !== index));


  const handleAgregarEmail = () => setEmails([...emails, ""]);
  const handleEliminarEmail = (index: number) =>
    setEmails(emails.filter((_, i) => i !== index));


  const handleAgregarEspecialidad = () => setEspecialidades([...especialidades, ""]);
  const handleEspecialidadChange = (index: number, valor: string) => {
    console.log(`Cambiando especialidad en índice ${index} a valor:`, valor);
    const nuevas = [...especialidades];
    nuevas[index] = valor;
    console.log('Nuevo array de especialidades:', nuevas);
    setEspecialidades(nuevas);
  };
  const handleEliminarEspecialidad = (index: number) => {
    setEspecialidades(especialidades.filter((_, i) => i !== index));
  };


  const handleDireccionChange = (index: number, campo: string, valor: string) => {
    const nuevas = [...direcciones];
    (nuevas[index] as any)[campo] = valor;
    setDirecciones(nuevas);
  };
  const handleAgregarDireccion = () =>
    setDirecciones([
      ...direcciones,
      { calle: "", numero: "", localidad: "", provincia: "", cp: "", horarios: [{ dias: [], desde: "", hasta: "" }] as unknown as BloqueHorario[] },
    ]);
  const handleEliminarDireccion = (index: number) =>
    setDirecciones(direcciones.filter((_, i) => i !== index));


  const diasSemana: { id: DiaSemana; label: string }[] = [
    { id: 'Lunes', label: "Lun" },
    { id: 'Martes', label: "Mar" },
    { id: 'Miercoles', label: "Mié" },
    { id: 'Jueves', label: "Jue" },
    { id: 'Viernes', label: "Vie" },
    { id: 'Sabado', label: "Sáb" },
  ];

  const addBloque = (dirIdx: number) => {
    const nuevas = [...direcciones];
    (nuevas[dirIdx].horarios as unknown as BloqueHorario[]).push({ dias: [], desde: "", hasta: "" });
    setDirecciones(nuevas);
  };

  const removeBloque = (dirIdx: number, bloqueIdx: number) => {
    const nuevas = [...direcciones];
    const hs = nuevas[dirIdx].horarios as unknown as BloqueHorario[];
    hs.splice(bloqueIdx, 1);
    if (hs.length === 0) hs.push({ dias: [], desde: "", hasta: "" });
    setDirecciones(nuevas);
  };

  const toggleDia = (dirIdx: number, bloqueIdx: number, dia: DiaSemana) => {
    const nuevas = [...direcciones];
    const hs = nuevas[dirIdx].horarios as unknown as BloqueHorario[];
    const bloque = hs[bloqueIdx] || { dias: [], desde: "", hasta: "" };
    const esta = bloque.dias.includes(dia);
    bloque.dias = esta ? bloque.dias.filter((d) => d !== dia) : [...bloque.dias, dia];
    hs[bloqueIdx] = bloque;
    setDirecciones(nuevas);
  };

  const setDesde = (dirIdx: number, bloqueIdx: number, value: string) => {
    const nuevas = [...direcciones];
    const hs = nuevas[dirIdx].horarios as unknown as BloqueHorario[];
    hs[bloqueIdx] = hs[bloqueIdx] || { dias: [], desde: "", hasta: "" };
    hs[bloqueIdx].desde = value;
    setDirecciones(nuevas);
  };

  const setHasta = (dirIdx: number, bloqueIdx: number, value: string) => {
    const nuevas = [...direcciones];
    const hs = nuevas[dirIdx].horarios as unknown as BloqueHorario[];
    hs[bloqueIdx] = hs[bloqueIdx] || { dias: [], desde: "", hasta: "" };
    hs[bloqueIdx].hasta = value;
    setDirecciones(nuevas);
  };


  const handleGuardar = async () => {
    if (!tipo) return setError("Debe seleccionar si es profesional o centro médico.");
    if (!cuilCuit.trim() || !nombreCompleto.trim())
      return setError("Complete el CUIL/CUIT y el nombre completo.");

    // Validar formato CUIT/CUIL (debe tener 11 dígitos, puede tener guiones)
    const cuitLimpio = cuilCuit.replace(/-/g, '');
    if (!/^\d{11}$/.test(cuitLimpio)) {
      return setError("El CUIT/CUIL debe tener 11 dígitos. Formato: XX-XXXXXXXX-X");
    }

    if (especialidades.filter((e) => e.trim() !== "").length === 0)
      return setError("Debe seleccionar al menos una especialidad.");

    try {
      // Preparar el payload para el backend
      const payload = {
        cuitCuil: cuilCuit.trim(),
        nombreCompleto: nombreCompleto.trim(),
        tipoPrestador: tipo === "centro" ? "centro_medico" : tipo, // Convertir "centro" a "centro_medico"
        especialidades: especialidades
          .filter((e) => e.trim() !== "")
          .map(e => parseInt(e, 10)), // Convertir a números enteros
        telefonos: telefonos.filter((t) => t.trim() !== ""),
        mails: emails.filter((e) => e.trim() !== ""), // Backend espera "mails"
        centroMedicoId: tipo === "profesional" && integraCentro ? integraCentro : null,
        lugarAtencion: direcciones[0] ? {
          direccion: `${direcciones[0].calle} ${direcciones[0].numero || ''}`.trim(),
          localidad: direcciones[0].localidad || null,
          codigoPostal: direcciones[0].cp || null,
          provincia: direcciones[0].provincia || null,
          horarios: (direcciones[0].horarios as unknown as BloqueHorario[])
            .filter(h => h.dias.length > 0 && h.desde && h.hasta)
            .map(h => ({
              dias: h.dias,
              desde: h.desde,
              hasta: h.hasta
            }))
        } : null
      };

      console.log("Enviando payload al backend:", JSON.stringify(payload, null, 2));

      // Llamar a la API
      const response = await fetch("http://localhost:3000/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error del servidor:", errorData);
        
        // Mostrar errores de validación específicos si existen
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(", ");
          throw new Error(`Errores de validación: ${errorMessages}`);
        }
        
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Prestador creado:", result);

      alert("Prestador agregado correctamente.");
      navigate("/prestadores");
    } catch (err: any) {
      console.error("Error al guardar prestador:", err);
      setError(err.message || "Error al guardar. Verifica la conexión con el servidor.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-[#5FA92C] mb-4">Agregar Prestador</h1>
      <div className="flex items-center gap-2 ">
        <ButtonVolver text="Volver" onClick={() => navigate("/prestadores")} />
      </div>
      {/* Selección tipo */}
      <div className="mb-6">
        <label className="block mt-2 text-lg  text-gray-700 mb-2">Tipo de Prestador</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipo"
              value="profesional"
              checked={tipo === "profesional"}
              onChange={() => setTipo("profesional")}
            />
            Profesional
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="tipo"
              value="centro"
              checked={tipo === "centro"}
              onChange={() => setTipo("centro")}
            />
            Centro Médico
          </label>
        </div>
      </div>

      {tipo && (
        <>
          {/* Campos generales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CUIL / CUIT</label>
              <input
                type="text"
                value={cuilCuit}
                onChange={(e) => setCuilCuit(e.target.value)}
                placeholder="Ej: 20-12345678-9"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Formato: XX-XXXXXXXX-X (11 dígitos)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>
          </div>

          {/* Especialidades */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidades {availableEspecialidades.length > 0 && `(${availableEspecialidades.length} disponibles)`}
            </label>
            {especialidades.map((esp, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select
                  value={esp}
                  onChange={(e) => {
                    console.log('Especialidad seleccionada:', e.target.value);
                    handleEspecialidadChange(i, e.target.value);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                >
                  <option value="">-- Seleccionar --</option>
                  {availableEspecialidades.map((s) => {
                    console.log('Renderizando opción:', s);
                    return <option key={s.id} value={s.id}>{s.nombre}</option>;
                  })}
                </select>
                {especialidades.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleEliminarEspecialidad(i)}
                    className="px-3 py-2 border rounded hover:bg-gray-50 text-red-500"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAgregarEspecialidad}
              className="text-[#5FA92C] text-sm font-semibold"
            >
              + Agregar otra especialidad
            </button>
          </div>

          {/* Centro médico (solo profesionales) */}
          {tipo === "profesional" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Pertenece a un centro médico?
              </label>
              <select
                value={integraCentro}
                onChange={(e) => setIntegraCentro(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              >
                <option value="">No pertenece</option>
                {centros.map((c) => (
                  <option key={c.cuilCuit} value={c.cuilCuit}>{c.nombreCompleto}</option>
                ))}
              </select>
            </div>
          )}

          {/* Teléfonos y Emails */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfonos</label>
              {telefonos.map((t, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={t}
                    onChange={(e) => {
                      const arr = [...telefonos];
                      arr[i] = e.target.value;
                      setTelefonos(arr);
                    }}
                    placeholder="Ej: 011 4444-5555"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                  {telefonos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarTelefono(i)}
                      className="px-3 py-2 border rounded hover:bg-gray-50 text-red-500"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAgregarTelefono}
                className="text-[#5FA92C] text-sm font-semibold"
              >
                + Agregar otro teléfono
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emails</label>
              {emails.map((em, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={em}
                    onChange={(e) => {
                      const arr = [...emails];
                      arr[i] = e.target.value;
                      setEmails(arr);
                    }}
                    placeholder="ejemplo@correo.com"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarEmail(i)}
                      className="px-3 py-2 border rounded hover:bg-gray-50 text-red-500"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAgregarEmail}
                className="text-[#5FA92C] text-sm font-semibold"
              >
                + Agregar otro email
              </button>
            </div>
          </div>

          {/* Direcciones */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Direcciones</h2>
            {direcciones.map((dir, idx) => (
              <div key={idx} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="Calle"
                    value={dir.calle}
                    onChange={(e) => handleDireccionChange(idx, "calle", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Número"
                    value={dir.numero}
                    onChange={(e) => handleDireccionChange(idx, "numero", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Localidad"
                    value={dir.localidad}
                    onChange={(e) => handleDireccionChange(idx, "localidad", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Provincia"
                    value={dir.provincia}
                    onChange={(e) => handleDireccionChange(idx, "provincia", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Código Postal"
                    value={dir.cp}
                    onChange={(e) => handleDireccionChange(idx, "cp", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                </div>



                {direcciones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleEliminarDireccion(idx)}
                    className="mt-2 text-red-500 font-semibold text-sm"
                  >
                    Eliminar dirección
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAgregarDireccion}
              className="text-[#5FA92C] text-sm font-semibold"
            >
              + Agregar otra dirección
            </button>
          </div>

          {/* Error */}
          {error && <div className="text-red-600 font-medium mb-4">{error}</div>}

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate("/prestadores")}
              className="bg-gray-300 text-black px-4 py-2 rounded-md font-medium hover:bg-gray-400 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="bg-[#5FA92C] text-white px-4 py-2 rounded-md font-medium hover:bg-[#4a8926] transition"
            >
              Guardar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
