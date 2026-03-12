import { gql } from "@apollo/client";
import { FRAGMENT_SEQUENCE } from "../queries/practiceTools";

export const CREAR_SECUENCIA = gql`
  ${FRAGMENT_SEQUENCE}
  mutation CrearSecuencia($input: CrearSecuenciaInput!) {
    crearSecuencia(input: $input) { ...SequenceFields }
  }
`;

export const ACTUALIZAR_SECUENCIA = gql`
  ${FRAGMENT_SEQUENCE}
  mutation ActualizarSecuencia($id: ID!, $input: ActualizarSecuenciaInput!) {
    actualizarSecuencia(id: $id, input: $input) { ...SequenceFields }
  }
`;

export const ELIMINAR_SECUENCIA = gql`
  mutation EliminarSecuencia($id: ID!) {
    eliminarSecuencia(id: $id)
  }
`;

export const MARCAR_ULTIMA_SECUENCIA = gql`
  mutation MarcarUltimaSecuencia($id: ID!) {
    marcarUltimaSecuencia(id: $id) { id ultimaAbierta }
  }
`;

export const GUARDAR_QUICK_SETTINGS = gql`
  mutation GuardarQuickSettings($input: QuickSettingsInput!) {
    guardarQuickSettings(input: $input) {
      id bpm pulsaciones subdivision sonido volumen a4Referencia updatedAt
    }
  }
`;

export const CREAR_PRESET = gql`
  mutation CrearPreset($input: CrearPresetInput!) {
    crearPreset(input: $input) {
      id nombre descripcion esPublico esFavorito datos etiquetas vecesUsado createdAt esPropio
    }
  }
`;

export const ACTUALIZAR_PRESET = gql`
  mutation ActualizarPreset($id: ID!, $input: ActualizarPresetInput!) {
    actualizarPreset(id: $id, input: $input) {
      id nombre descripcion esPublico esFavorito esPorDefecto datos etiquetas esPropio
    }
  }
`;

export const ELIMINAR_PRESET = gql`
  mutation EliminarPreset($id: ID!) {
    eliminarPreset(id: $id)
  }
`;