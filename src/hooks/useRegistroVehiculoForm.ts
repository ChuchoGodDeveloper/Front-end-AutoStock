import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerModelosPorMarca } from '../config/marcasModelos'
import { HttpError } from '../services/httpClient'
import { vehiculosService } from '../services/vehiculosService'
import { useCatalogoStore } from '../stores/catalogoStore'
import { EstadoOperativo, type RegistrarVehiculoDto, TipoVehiculo } from '../types/vehiculo'

export const REGEX_VIN = /^[A-HJ-NPR-Z0-9]{17}$/

export interface CamposVehiculoForm {
  tipo: TipoVehiculo
  vin: string
  marca: string
  modelo: string
  version: string
  anio: string
  placa: string
  kilometraje: string
  transmision: string
  motor: string
  potencia: string
  colorExterior: string
  colorInterior: string
  precio: string
  estado: EstadoOperativo
  zonaLote: string
  cajonLote: string
  equipamiento: string
  notasInspeccion: string
}

export type ErroresVehiculoForm = Partial<Record<keyof CamposVehiculoForm, string>>

const ANIO_MINIMO = 1990

export const VALORES_INICIALES: CamposVehiculoForm = {
  tipo: TipoVehiculo.Seminuevo,
  vin: '',
  marca: '',
  modelo: '',
  version: '',
  anio: new Date().getFullYear().toString(),
  placa: '',
  kilometraje: '',
  transmision: 'Automática',
  motor: '',
  potencia: '',
  colorExterior: '',
  colorInterior: '',
  precio: '',
  estado: EstadoOperativo.Disponible,
  zonaLote: 'Zona A',
  cajonLote: '',
  equipamiento: '',
  notasInspeccion: '',
}

export function useRegistroVehiculoForm(valoresPrecarga?: Partial<CamposVehiculoForm>) {
  const navigate = useNavigate()
  const invalidarCatalogo = useCatalogoStore((estado) => estado.invalidarCatalogo)
  const cargarConteosRapidos = useCatalogoStore((estado) => estado.cargarConteosRapidos)

  const anioMaximo = new Date().getFullYear() + 1

  const [campos, setCampos] = useState<CamposVehiculoForm>({
    ...VALORES_INICIALES,
    ...valoresPrecarga,
  })

  const [errores, setErrores] = useState<ErroresVehiculoForm>({})
  const [tocado, setTocado] = useState<Partial<Record<keyof CamposVehiculoForm, boolean>>>({})
  const [guardando, setGuardando] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [vehiculoDuplicadoId, setVehiculoDuplicadoId] = useState<string | null>(null)
  const [pasoActual, setPasoActual] = useState(1)

  const modelosDisponibles = obtenerModelosPorMarca(campos.marca)

  const cambiarCampo = <K extends keyof CamposVehiculoForm>(nombre: K, valor: CamposVehiculoForm[K]) => {
    setCampos((prev) => {
      const nuevo = { ...prev, [nombre]: valor }

      // Cascada: si cambia la marca, limpiar el modelo para evitar inconsistencias
      if (nombre === 'marca' && valor !== prev.marca) {
        nuevo.modelo = ''
      }

      // Si se cambia a tipo Nuevo, fijar kilometraje en 0 y limpiar placa
      if (nombre === 'tipo') {
        if (valor === TipoVehiculo.Nuevo) {
          nuevo.kilometraje = '0'
          nuevo.placa = ''
        } else if (prev.kilometraje === '0') {
          nuevo.kilometraje = ''
        }
      }

      return nuevo
    })

    setTocado((prev) => ({ ...prev, [nombre]: true }))

    // Limpiar error del campo
    if (errores[nombre]) {
      setErrores((prev) => {
        const nuevo = { ...prev }
        delete nuevo[nombre]
        return nuevo
      })
    }

    if (mensajeError) setMensajeError('')
    if (vehiculoDuplicadoId) setVehiculoDuplicadoId(null)
  }

  const validarCamposPaso = (paso: number): boolean => {
    const nuevosErrores: ErroresVehiculoForm = {}

    if (paso === 1) {
      if (!campos.vin.trim()) {
        nuevosErrores.vin = 'El VIN es obligatorio'
      } else if (!REGEX_VIN.test(campos.vin.trim())) {
        nuevosErrores.vin = 'El VIN debe tener 17 caracteres alfanuméricos válidos (sin I, O, Q)'
      }

      if (!campos.marca.trim()) {
        nuevosErrores.marca = 'La marca es obligatoria'
      }

      if (!campos.modelo.trim()) {
        nuevosErrores.modelo = 'El modelo es obligatorio'
      }

      const anioNum = parseInt(campos.anio, 10)
      if (!campos.anio.trim() || Number.isNaN(anioNum)) {
        nuevosErrores.anio = 'El año es obligatorio'
      } else if (anioNum < ANIO_MINIMO || anioNum > anioMaximo) {
        nuevosErrores.anio = `El año debe estar entre ${ANIO_MINIMO} y ${anioMaximo}`
      }

      if (campos.tipo === TipoVehiculo.Seminuevo) {
        if (!campos.placa.trim()) {
          nuevosErrores.placa = 'La placa es obligatoria para unidades seminuevas'
        } else if (campos.placa.trim().length < 5 || campos.placa.trim().length > 10) {
          nuevosErrores.placa = 'La placa debe tener entre 5 y 10 caracteres'
        }
      }
    }

    if (paso === 2) {
      if (campos.tipo === TipoVehiculo.Seminuevo) {
        const kmNum = parseInt(campos.kilometraje, 10)
        if (campos.kilometraje === '' || Number.isNaN(kmNum)) {
          nuevosErrores.kilometraje = 'El kilometraje es obligatorio'
        } else if (kmNum < 0) {
          nuevosErrores.kilometraje = 'El kilometraje no puede ser negativo'
        }
      }

      if (!campos.transmision.trim()) {
        nuevosErrores.transmision = 'La transmisión es obligatoria'
      }
    }

    if (paso === 3) {
      const precioNum = parseFloat(campos.precio)
      if (!campos.precio.trim() || Number.isNaN(precioNum)) {
        nuevosErrores.precio = 'El precio es obligatorio'
      } else if (precioNum <= 0) {
        nuevosErrores.precio = 'El precio debe ser mayor a 0'
      } else if (precioNum > 99999999) {
        nuevosErrores.precio = 'El precio excede el límite permitido'
      }

      if (!campos.zonaLote.trim()) {
        nuevosErrores.zonaLote = 'La zona del lote es obligatoria'
      }

      if (!campos.cajonLote.trim()) {
        nuevosErrores.cajonLote = 'El cajón del lote es obligatorio'
      } else if (campos.cajonLote.trim().length > 6) {
        nuevosErrores.cajonLote = 'El cajón no puede exceder 6 caracteres'
      }
    }

    setErrores((prev) => ({ ...prev, ...nuevosErrores }))
    return Object.keys(nuevosErrores).length === 0
  }

  const validarTodo = (): boolean => {
    const paso1Ok = validarCamposPaso(1)
    const paso2Ok = validarCamposPaso(2)
    const paso3Ok = validarCamposPaso(3)
    return paso1Ok && paso2Ok && paso3Ok
  }

  const siguientePaso = () => {
    if (validarCamposPaso(pasoActual)) {
      setPasoActual((p) => Math.min(3, p + 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const pasoAnterior = () => {
    setPasoActual((p) => Math.max(1, p - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const irAlPaso = (nuevoPaso: number) => {
    if (nuevoPaso < pasoActual || validarCamposPaso(pasoActual)) {
      setPasoActual(nuevoPaso)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const manejarEnvio = async (evento?: FormEvent) => {
    if (evento) evento.preventDefault()

    if (!validarTodo()) {
      setMensajeError('Por favor revisa los campos marcados en rojo')
      return
    }

    setGuardando(true)
    setMensajeError('')
    setVehiculoDuplicadoId(null)

    try {
      const dto: RegistrarVehiculoDto = {
        tipo: campos.tipo,
        vin: campos.vin.trim().toUpperCase(),
        marca: campos.marca.trim(),
        modelo: campos.modelo.trim(),
        anio: parseInt(campos.anio, 10),
        version: campos.version.trim() || undefined,
        placa: campos.tipo === TipoVehiculo.Seminuevo ? campos.placa.trim().toUpperCase() : undefined,
        kilometraje: campos.tipo === TipoVehiculo.Nuevo ? 0 : parseInt(campos.kilometraje, 10),
        transmision: campos.transmision.trim(),
        motor: campos.motor.trim(),
        potencia: campos.potencia.trim() || undefined,
        colorExterior: campos.colorExterior.trim(),
        colorInterior: campos.colorInterior.trim(),
        precio: parseFloat(campos.precio),
        estado: campos.estado,
        zonaLote: campos.zonaLote.trim(),
        cajonLote: campos.cajonLote.trim(),
        equipamiento: campos.equipamiento.trim() || undefined,
        notasInspeccion: campos.notasInspeccion.trim() || undefined,
      }

      const creado = await vehiculosService.registrarVehiculo(dto)

      invalidarCatalogo()
      cargarConteosRapidos()

      navigate(`/vehiculo/${creado.id}`, {
        state: { mensajeExito: `Unidad registrada con éxito. Número de stock asignado: ${creado.numeroStock}` },
      })
    } catch (error) {
      if (error instanceof HttpError) {
        const cuerpo = error.body as { mensaje?: string; vehiculoId?: string } | undefined
        const textoError = cuerpo?.mensaje || error.message || 'Error al registrar la unidad'
        setMensajeError(textoError)

        if (cuerpo?.vehiculoId) {
          setVehiculoDuplicadoId(cuerpo.vehiculoId)
        }
      } else {
        setMensajeError('Error de conexión. Intente nuevamente.')
      }
    } finally {
      setGuardando(false)
    }
  }

  return {
    campos,
    errores,
    tocado,
    guardando,
    mensajeError,
    vehiculoDuplicadoId,
    pasoActual,
    anioMaximo,
    modelosDisponibles,
    cambiarCampo,
    siguientePaso,
    pasoAnterior,
    irAlPaso,
    manejarEnvio,
    validarCamposPaso,
  }
}
