import {
  buildFinalFatalityFrame,
  renderDirectionalFrame,
  type DirectionalFrameSpec,
} from './asciiUtils';

export type AsciiSceneType =
  | 'duel'
  | 'animal'
  | 'transport'
  | 'magic'
  | 'sci_fi'
  | 'disaster'
  | 'absurd'
  | 'sport';

export interface AsciiSceneDefinition {
  id: string;
  title: string;
  type: AsciiSceneType;
  description: string;
  frameDelayMs: number;
  durationMs: number;
  participants: string[];
  buildFrames: (params: {
    winnerSide: 'left' | 'right';
    winnerName: string;
    loserName: string;
  }) => string[];
}

function compileDirectionalScene(
  specs: DirectionalFrameSpec[],
  winnerSide: 'left' | 'right',
  winnerName: string,
  loserName: string
): string[] {
  const frames = specs.map((spec) =>
    renderDirectionalFrame(spec, winnerSide, winnerName, loserName)
  );
  frames.push(buildFinalFatalityFrame());
  return frames;
}

export const ASCII_SCENES_PART_1: AsciiSceneDefinition[] = [
  // 1. Classic Fight
  {
    id: 'classic_fight',
    title: '🥊 Классический нокаут',
    type: 'duel',
    description: 'Один боец подбегает и сносит второго сокрушительным апперкотом.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'FIGHT!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '        O                   O   ',
              '       /|==>               /|\\  ',
              '       / \\                 / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'STEP IN!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '',
              '              O             O   ',
              '             /|==>         /|\\  ',
              '             / \\           / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'CHARGE!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '                    O  *!   O   ',
              '                   /|====> \\|/  ',
              '                   / \\     / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'PUNCH!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      \\|/       ',
              '                    O -X-  \\O/  ',
              '                   /|  |    |   ',
              '                   / \\     / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* CRASH! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '                    O           ',
              '                   \\|/    __O_  ',
              '                   / \\   /  |\\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'K.O.!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '    \\O/                         ',
              '     |                          ',
              '    / \\             _@___O___   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'WIN!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 2. Horse Stampede
  {
    id: 'horse_stampede',
    title: '🐎 Нашествие скакунов',
    type: 'animal',
    description: 'Табун диких лошадей проносится по чату и затаптывает не взявшего трубку.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'horses'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '================================',
            ],
            labels: [{ row: 1, text: 'CALL MISSED...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  ~ ~                           ',
              '  O   ,/,,                      ',
              ' /|\\ <====>                O!   ',
              ' / \\  /\\ /\\               /|\\   ',
              '================================',
            ],
            labels: [{ row: 1, text: 'ТОПОТ...', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '      ,/,,   ,/,,               ',
              '     <====> <====>         \\O/  ',
              '      /\\ /\\  /\\ /\\          |   ',
              '     * * *  * * *          / \\  ',
              '================================',
            ],
            labels: [{ row: 1, text: 'STAMPEDE!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '           ,/,,   ,/,,          ',
              '          <====> <====>    \\O/  ',
              '           /\\ /\\  /\\ /\\    /|\\  ',
              '          * * *  * * *     / \\  ',
              '================================',
            ],
            labels: [{ row: 1, text: 'RUN!!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '                ,/,,   ,/,,     ',
              '               <====> <==*X*>   ',
              '                /\\ /\\  /\\/_\\    ',
              '               * * *  * * *     ',
              '================================',
            ],
            labels: [{ row: 1, text: '* TRAMPLED! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                     ,/,,   ,/,,',
              '                    <====> <====',
              '   \\O/      *  #      /\\ /\\  /\\ ',
              '    |       _O__                ',
              '================================',
            ],
            labels: [{ row: 1, text: 'K.O. BY HORSE', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   \\O/                          ',
              '    |   ~ ~                     ',
              '   / \\       ___O___  * * *     ',
              '================================',
            ],
            labels: [{ row: 1, text: 'VICTORY!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 3. Giant Dinosaur
  {
    id: 'giant_dinosaur',
    title: '🦖 Огромный динозавр',
    type: 'animal',
    description: 'Тираннозавр врывается в сцену и съедает опаздывающего к телефону.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 't-rex'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'SUMMON T-REX', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '    __                          ',
              '   / _)                         ',
              '  / /                      O    ',
              ' / /__                    /|\\   ',
              '|____/                    / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'STOMP!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '       ____                     ',
              '      / O  \\                    ',
              '     |  ===<               O!   ',
              '    /|_____/              /|\\   ',
              '     |  |                 / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ROOOAAAR!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '             ____               ',
              '            / O  \\              ',
              '           |  ====>       \\O/   ',
              '          /|_____/         |    ',
              '           |  |           / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'HELP!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '                   ____         ',
              '                  / O  \\        ',
              '                 |   \\O/!       ',
              '                /|____|         ',
              '                 |  |           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'CHOMP!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                   ____         ',
              '                  / ^  \\        ',
              '                 |  ===         ',
              '                /|____\\   * * * ',
              '                 |  |           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'NOM NOM!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   \\O/             ____         ',
              '    |             / ^  \\        ',
              '   / \\           |  ===         ',
              '                /|____\\         ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'DINO WINS!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 4. Express Train
  {
    id: 'express_train',
    title: '🚂 Поезд-экспресс',
    type: 'transport',
    description: 'Поезд несётся через экран и сносит не поднявшего трубку.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'train'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '===+===+===+===+===+===+===+====',
            ],
            labels: [{ row: 1, text: 'CHOO-CHOO...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  o o                           ',
              ' [___]                     O    ',
              ' |===|\\                   /|\\   ',
              ' o---o                    / \\   ',
              '===+===+===+===+===+===+===+====',
            ],
            labels: [{ row: 1, text: 'TRAIN INBOUND', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '       o o o                    ',
              '   ___[___]                O!   ',
              '  |=======|\\              /|\\   ',
              '  o--o-o--o               / \\   ',
              '===+===+===+===+===+===+===+====',
            ],
            labels: [{ row: 1, text: 'CHOO-CHOO!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '             o o o              ',
              '         ___[___]         \\O/   ',
              '        |=======|\\         |    ',
              '        o--o-o--o         / \\   ',
              '===+===+===+===+===+===+===+====',
            ],
            labels: [{ row: 1, text: 'NO BRAKES!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                  o o o         ',
              '              ___[___]  * * *   ',
              '             |=======|\\ \\O/     ',
              '             o--o-o--o  /|\\     ',
              '===+===+===+===+===+===+===+====',
            ],
            labels: [{ row: 1, text: '* BOOM SMASH! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                        o o o   ',
              '                    ___[___]    ',
              '  \\O/              |=======|\\   ',
              '   |      * *      o--o-o--o    ',
              '===+===+===+===+===+===+===+====',
            ],
            labels: [{ row: 1, text: 'DIRECT HIT!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  \\O/                           ',
              '   |                 ___O___    ',
              '  / \\               /   *   \\   ',
              '===+===+===+===+===+===+===+====',
            ],
            labels: [{ row: 1, text: 'EXPRESS K.O.', align: 'center' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 5. Shadow Ninja
  {
    id: 'shadow_ninja',
    title: '🥷 Призрак-ниндзя',
    type: 'duel',
    description: 'Тень появляется за спиной и делает моментальный комбо-удар.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '  [=]                       O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'NINJA MODE', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '   ~ ~                      O   ',
              '  ( * )                    /|\\  ',
              '   ~ ~                     / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'VANISHED...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '           ==> ==>          O   ',
              '                           /|\\  ',
              '                           / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'SHURIKENS!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                    [=]     O   ',
              '                    /|\\*   /|\\  ',
              '                    / \\    / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'BEHIND YOU!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      \\|/       ',
              '                   [=]-/-\\O/    ',
              '                   /|  \\  |     ',
              '                   / \\   / \\    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'SLASH! SLASH!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   [=]                          ',
              '   /|\\               *  #  *    ',
              '   / \\               __O___     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'CRITICAL K.O.', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   \\O/                          ',
              '    |      ~ ~ ~                ',
              '   / \\               __X___     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'FLAWLESS!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 6. Mini-Fighter Army
  {
    id: 'mini_army',
    title: '⚔️ Армия мини-человечков',
    type: 'absurd',
    description: 'Десяток крошечных воинов атакует не взявшего трубку со всех сторон.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'army'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'CALLING ARMY!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '   O                        O   ',
              '  /|\\ o  o  o              /|\\  ',
              '  / \\/|\\/|\\/|\\             / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'MARCH!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   O      o  o  o  o        O!  ',
              '  /|\\    /|\\/|\\/|\\/|\\      /|\\  ',
              '  / \\    /\\/\\/\\/\\/\\/\\      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'FOR SPARTA!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   O            o  o  o  o \\O/  ',
              '  /|\\          /|\\/|\\/|\\/|\\ |   ',
              '  / \\          /\\/\\/\\/\\/\\/\\/ \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'SURROUND HIM!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   O               * o * o *    ',
              '  /|\\             /|\\X\\O/X/|\\   ',
              '  / \\              /\\/ | \\/\\    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'SWARM ATTACK!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   O                 o  o  o    ',
              '  /|\\               /|\\/|\\/|\\   ',
              '  / \\              ___O___      ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'TIED DOWN!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  \\O/      o  o  o              ',
              '   |      /|\\/|\\/|\\   __O__     ',
              '  / \\                 / * \\     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ARMY WINS!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 7. Meteor Strike
  {
    id: 'meteor_strike',
    title: '☄️ Падение метеорита',
    type: 'disaster',
    description: 'Космический булыжник падает с неба прямо на голову игнорщика.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'meteor'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                         ***    ',
              '                        (###)   ',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'LOOK UP!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      ***       ',
              '                     (###)      ',
              '   O                 /|/|   O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'INCOMING!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '                       ***      ',
              '   O                  (###) O!  ',
              '  /|\\                 /|/| /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'METEOR!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O                      (###) ',
              '  /|\\                     /|\\O/ ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'OH NO!!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '                      \\ | /     ',
              '                    * (###) *   ',
              '   O               * * *** * *  ',
              '  /|\\               *  #X#  *   ',
              '  / \\                 / | \\     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* K A B O O M ! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      ~ ~ ~     ',
              '  \\O/                *  #  *    ',
              '   |                 \\(###)/    ',
              '  / \\                 _\\O/_     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'CRATERED!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  \\O/                           ',
              '   |                  ~  ~      ',
              '  / \\               __(###)__   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'SPACE K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 8. UFO Abduction
  {
    id: 'ufo_abduction',
    title: '🛸 Инопланетное похищение',
    type: 'sci_fi',
    description: 'Тарелка прилетает сверху, включает луч и уносит игрока в космос.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'ufo'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '    .---.                       ',
              '  -(o-o-o)-                     ',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'UFO DETECTED', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                     .---.      ',
              '                   -(o-o-o)-    ',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'LOCKING ON...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       .---.    ',
              '                     -(o-o-o)-  ',
              '   O                   /   \\    ',
              '  /|\\                 /  O  \\   ',
              '  / \\                /  /|\\  \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'BEAM ON!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       .---.    ',
              '                     -(o-o-o)-  ',
              '   O                   /\\O/\\    ',
              '  /|\\                 /  |  \\   ',
              '  / \\                /  / \\  \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'HELP!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '                       .---.    ',
              '                     -(o\\O/o)-  ',
              '   O                   / | \\    ',
              '  /|\\                 / / \\ \\   ',
              '  / \\                /       \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ABDUCTED!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       .---.    ',
              '                     -(*===*)-  ',
              '   \\O/                          ',
              '    |                           ',
              '   / \\                 * * *    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'GONE!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                            *   ',
              '  \\O/                  .---.    ',
              '   |                            ',
              '  / \\                 (x_x)     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ALIEN K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 9. Sumo Ring
  {
    id: 'sumo_ring',
    title: '🥋 Сумо-выталкивание',
    type: 'sport',
    description: 'Боец-сумоист выталкивает соперника за край ринга.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '  (O)                       O   ',
              ' /( )\\                     /|\\  ',
              '  / \\                      / \\  ',
              '================================',
            ],
            labels: [
              { row: 1, text: 'HAKKEYOI!', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  SUMO RING  ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '       (O)                  O   ',
              '      /( )\\=>              /|\\  ',
              '       / \\                 / \\  ',
              '================================',
            ],
            labels: [
              { row: 1, text: 'DOSUKOI!!', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  SUMO RING  ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '              (O)           O   ',
              '             /( )\\==>      /|\\  ',
              '              / \\          / \\  ',
              '================================',
            ],
            labels: [
              { row: 1, text: 'HEAVY CHARGE!', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  SUMO RING  ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '                   (O) *!  \\O/  ',
              '                  /( )\\==>  |   ',
              '                   / \\     / \\  ',
              '================================',
            ],
            labels: [
              { row: 1, text: '* BUMP! *', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  SUMO RING  ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '                    (O)      \\O/',
              '                   /( )\\==>   | ',
              '                    / \\      / \\',
              '========================        ',
            ],
            labels: [
              { row: 1, text: 'RING OUT!!', align: 'center' },
              { row: 5, col: 4, flipCol: true, text: '[  SUMO RING  ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '                   \\(O)/        ',
              '                    ( )         ',
              '                    / \\     \\O/ ',
              '========================     X  ',
            ],
            labels: [
              { row: 1, text: 'SPLASH!', align: 'center' },
              { row: 5, col: 4, flipCol: true, text: '[  SUMO RING  ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '                   \\(O)/        ',
              '                    ( )         ',
              '                    / \\         ',
              '========================   __O__',
            ],
            labels: [
              { row: 1, text: 'YOKOZUNA WIN!', align: 'winner' },
              { row: 5, col: 4, flipCol: true, text: '[  SUMO RING  ]' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 10. Tsunami Wave
  {
    id: 'tsunami_wave',
    title: '🌊 Цунами смывает',
    type: 'disaster',
    description: 'Гигантская волна накатывает по строкам и уносит игрока за край экрана.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'wave'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'WATER RISING...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  ~~~~\\                         ',
              ' ~~~~~ \\                    O   ',
              '~~~~~~  |   O              /|\\  ',
              '~~~~~~ /   /|\\             / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'TSUNAMI!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '       ~~~~~~~\\                 ',
              '      ~~~~~~~~ \\            O!  ',
              '   O ~~~~~~~~~  |          /|\\  ',
              '  /|\\~~~~~~~~~ /           / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'BIG WAVE!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '             ~~~~~~~~\\          ',
              '            ~~~~~~~~~ \\    \\O/  ',
              '   O       ~~~~~~~~~~  |    |   ',
              '  /|\\     ~~~~~~~~~~~ /    / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'SWIM!!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '                   ~~~~~~~~\\    ',
              '                  ~~~~~~~~~ \\   ',
              '   O             ~~~~~~\\O/~~ |  ',
              '  /|\\           ~~~~~~~~|~~~ /  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'SWEPT AWAY!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                         ~~~~~~~',
              '                        ~~~~~~~~',
              '  \\O/                  ~~~~~~~~~',
              '   |      ~ ~          ~~~~*~~~~',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'BLUB BLUB!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  \\O/                           ',
              '   |                            ',
              '  / \\                 ~ ~ ~ O ~ ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'WASHED OUT!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 11. Wizard Frog Spell
  {
    id: 'wizard_frog',
    title: '🧙 Магическое превращение',
    type: 'magic',
    description: 'Волшебник кастует заклинание, и соперник превращается в лягушку!',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '   /\\                           ',
              '  /__\\                      O   ',
              '   O  |                    /|\\  ',
              '  /|\\ |                    / \\  ',
              '  / \\ *                         ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ABRA...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   /\\                           ',
              '  /__\\                      O   ',
              '   O  *==>                 /|\\  ',
              '  /|\\ |                    / \\  ',
              '  / \\                           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'KADABRA!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   /\\                           ',
              '  /__\\                      O   ',
              '   O  *~~~~~~*==>          /|\\  ',
              '  /|\\ |                    / \\  ',
              '  / \\                           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ZAP!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   /\\                   *  *  * ',
              '  /__\\                 *  \\O/ * ',
              '   O  *~~~~~~~~~~~~~>  *   |  * ',
              '  /|\\ |                 * / \\ * ',
              '  / \\                           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* POOF! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   /\\                           ',
              '  /__\\                   * * *  ',
              '   O                    *(o_o)* ',
              '  /|\\                   *(___)* ',
              '  / \\                    "   "  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'RIBBIT?!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   /\\                           ',
              '  /__\\                          ',
              '  \\O/                   (o_o)   ',
              '   |                    (   )   ',
              '  / \\                   "^ ^"   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'КВА-КВА!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '   /\\                           ',
              '  /__\\                          ',
              '  \\O/                  (o_o)    ',
              '   |                   (   )    ',
              '  / \\                  "^ ^"    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'FROG CURSE!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 12. Giant Chicken
  {
    id: 'giant_chicken',
    title: '🐔 Бешеная гигантская курица',
    type: 'animal',
    description: 'Гигантская курица выбегает, клюёт врага и уводит его за экран.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'chicken'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'KO-KO-KO?!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   ~                            ',
              '  (o>                      O    ',
              '  / )\\   O                /|\\   ',
              '  _||_  /|\\               / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'MEGA HEN!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '         ~                      ',
              '        (o>==>             O!   ',
              '        / )\\              /|\\   ',
              '        _||_              / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'BOK-BOK!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                ~               ',
              '               (o>==>     \\O/   ',
              '               / )\\        |    ',
              '               _||_       / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'PECK! PECK!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                     ~          ',
              '                    (o>*! \\O/   ',
              '                    / )\\   |    ',
              '                    _||_  / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* CLUCK SMASH *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                          ~     ',
              '   \\O/                   (o>O\\  ',
              '    |                    / )\\|  ',
              '   / \\                   _||_|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'CARRIED OFF!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   \\O/                          ',
              '    |      ~ ~ ~                ',
              '   / \\       * * *      (o>     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'CHICKEN K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 13. Red Button Explosion
  {
    id: 'red_button_boom',
    title: '💣 Взрыв кнопки',
    type: 'absurd',
    description: 'Над игроком появляется красная кнопка с отсчётом 3... 2... 1... BOOM!',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser', 'bomb'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                       [===]    ',
              '   O                     |  O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'PRESS!', align: 'winner' },
              { row: 2, col: 23, flipCol: true, text: '[BTN]' },
            ],
          },
          {
            art: [
              '',
              '',
              '                       ( 3 )    ',
              '   O                    [!] O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'TICK... 3', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       ( 2 )    ',
              '   O                    [!] O!  ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'TOCK... 2', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       ( 1 )    ',
              '   O                    [!]\\O/  ',
              '  /|\\                       |   ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '1... RUN!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                     \\  |  /    ',
              '                    * * * * *   ',
              '   O               * * #X# * *  ',
              '  /|\\               * / | \\ *   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* B O O M ! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      (###)     ',
              '   \\O/               (#####)    ',
              '    |                  | |      ',
              '   / \\                /   \\     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ASHES...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   \\O/                          ',
              '    |                 * * *     ',
              '   / \\               __xOx__    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'BOOM K.O.!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 14. Boxing Ring
  {
    id: 'boxing_ring',
    title: '🥊 Боксёрский ринг',
    type: 'sport',
    description: 'Два боксёра сходятся на ринге, серия джебов и нокаут с канатами.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '|------------------------------|',
              '|  O                        O  |',
              '| /@\\                      /@\\ |',
              '| / \\                      / \\ |',
              '|==============================|',
            ],
            labels: [{ row: 1, text: 'DING DING!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '|------------------------------|',
              '|      O==>             O      |',
              '|     /@\\              /@\\     |',
              '|     / \\              / \\     |',
              '|==============================|',
            ],
            labels: [{ row: 1, text: 'JAB! JAB!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '|------------------------------|',
              '|           O=====>     O      |',
              '|          /@\\         /@\\     |',
              '|          / \\         / \\     |',
              '|==============================|',
            ],
            labels: [{ row: 1, text: 'HOOK!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '|------------------------------|',
              '|               O==*!  \\O/     |',
              '|              /@\\      |      |',
              '|              / \\     / \\     |',
              '|==============================|',
            ],
            labels: [{ row: 1, text: 'UPPERCUT!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '|------------------------------|',
              '|               O      * *  \\O/|',
              '|              /@\\     * *   | |',
              '|              / \\          / \\|',
              '|==============================|',
            ],
            labels: [{ row: 1, text: 'DOWN GOES 2!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '|------------------------------|',
              '|           \\O/                |',
              '|            @                 |',
              '|           / \\      ___O___   |',
              '|==============================|',
            ],
            labels: [{ row: 1, text: '1..2..3..K.O.!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '|------------------------------|',
              '|  \\O/                         |',
              '|   @                          |',
              '|  / \\               __xOx__   |',
              '|==============================|',
            ],
            labels: [
              { row: 1, text: 'KNOCKOUT!', align: 'winner' },
              { row: 3, col: 8, flipCol: true, text: 'CHAMP!' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 15. Trapdoor Pit
  {
    id: 'trapdoor_pit',
    title: '🕳️ Люк в полу',
    type: 'absurd',
    description: 'Под игроком открывается люк и он стремительно проваливается вниз.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '========================[====]==',
            ],
            labels: [{ row: 1, text: 'PULL LEVER!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '   O                        O   ',
              '  /|\\_                     /|\\  ',
              '  / \\ |                    / \\  ',
              '========================[____]==',
            ],
            labels: [{ row: 1, text: '* CLICK! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   O                       \\O/  ',
              '  /|\\                       |   ',
              '  / \\                      / \\  ',
              '========================      ==',
            ],
            labels: [{ row: 1, text: 'WHOOOOA!!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '   O                            ',
              '  /|\\                           ',
              '  / \\                      \\O/  ',
              '========================    | ==',
              '                           / \\  ',
            ],
            labels: [{ row: 1, text: 'FALLING...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '   O                            ',
              '  /|\\                           ',
              '  / \\                           ',
              '========================      ==',
              '                           \\O/  ',
              '                            |   ',
            ],
            labels: [{ row: 1, text: 'AAAAAaaah...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  \\O/                           ',
              '   |                            ',
              '  / \\                           ',
              '========================      ==',
              '                                ',
              '                          * * * ',
            ],
            labels: [{ row: 1, text: 'BASEMENT K.O.', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  \\O/                           ',
              '   |                            ',
              '  / \\                           ',
              '========================[====]==',
            ],
            labels: [{ row: 1, text: 'TRAPPED!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },
];
