import { gql } from "@apollo/client";

export const FRAGMENT_SECCION = gql`
  fragment SeccionFields on Seccion {
    seccionId
    nombre
    compas { numerador denominador }
    tempo { tipo bpm inicio fin curva }
    subdivision
    patronAcento
    repeticiones
  }
`;

export const FRAGMENT_SEQUENCE = gql`
  ${FRAGMENT_SECCION}
  fragment SequenceFields on PracticeSequence {
    id nombre descripcion
    secciones { ...SeccionFields }
    countIn countInBeats sonido volumen
    ultimaAbierta lastUsedAt createdAt updatedAt
  }
`;

export const GET_MIS_SECUENCIAS = gql`
  ${FRAGMENT_SEQUENCE}
  query MisSecuencias {
    misSecuencias { ...SequenceFields }
  }
`;

export const GET_ULTIMA_SECUENCIA = gql`
  ${FRAGMENT_SEQUENCE}
  query UltimaSecuencia {
    ultimaSecuencia { ...SequenceFields }
  }
`;

export const GET_MIS_QUICK_SETTINGS = gql`
  query MisQuickSettings {
    misQuickSettings {
      id bpm pulsaciones subdivision sonido volumen a4Referencia updatedAt
    }
  }
`;

export const GET_MIS_PRESETS = gql`
  query MisPresets {
    misPresets {
      id nombre descripcion esPublico esFavorito esPorDefecto
      datos etiquetas vecesUsado lastUsedAt createdAt esPropio
    }
  }
`;

export const GET_PRESETS_PUBLICOS = gql`
  query PresetsPublicos($limite: Int, $offset: Int) {
    presetsPublicos(limite: $limite, offset: $offset) {
      id nombre descripcion esFavorito datos etiquetas vecesUsado createdAt esPropio
    }
  }
`;