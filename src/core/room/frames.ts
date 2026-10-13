import type { FrameDefinition } from '../types';
import { frames } from '../../frames/catalog';

const preset = (
  id: string,
  name: string,
  palette: FrameDefinition['palette'],
  description: string,
): FrameDefinition => ({
  id,
  name,
  version: 1,
  format: 'card',
  categories: ['couple'],
  designWidth: 1800,
  designHeight: 1350,
  slots: [
    {
      id: 'p1',
      order: 1,
      x: 0.045,
      y: 0.06,
      w: 0.91,
      h: 0.72,
      shape: 'roundedRect',
      radius: 16,
      rotationDeg: 0,
      matteColor: palette.secondary,
    },
  ],
  textAreas: [],
  palette,
  layers: {
    background: `/frames/online-room/${id}/background.svg`,
    foreground: `/frames/online-room/${id}/foreground.svg`,
  },
  thumbnail: `/frames/online-room/${id}/background.svg`,
  licenses: ['Original artwork by fotbooth'],
  description,
  collection: 'Foto Bareng',
});

export const roomFrames: FrameDefinition[] = [
  preset(
    'online-satu-tempat',
    'Satu Tempat',
    {
      background: '#fff8ed',
      ink: '#653e38',
      accent: '#b95657',
      secondary: '#efe4d6',
    },
    'Satu foto lebar untuk berdua, dibingkai kertas hangat dan cap hati.',
  ),
  preset(
    'online-surat-rindu',
    'Surat Rindu',
    {
      background: '#fff4e7',
      ink: '#724a43',
      accent: '#bf5d58',
      secondary: '#f1dfce',
    },
    'Kartu pos lembut dengan tulisan rindu dan perangko untuk momen kalian.',
  ),
  preset(
    'online-night-date',
    'Night Date',
    {
      background: '#27263d',
      ink: '#f7e8d4',
      accent: '#e3c091',
      secondary: '#454157',
    },
    'Bingkai malam bernuansa plum, bintang kecil, dan aksen emas.',
  ),
];

export const onlineRoomFrames: FrameDefinition[] = [...frames, ...roomFrames];

export function getRoomFrame(id?: string | null): FrameDefinition {
  return onlineRoomFrames.find((frame) => frame.id === id) ?? roomFrames[0];
}
