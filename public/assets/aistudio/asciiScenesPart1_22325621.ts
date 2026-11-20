import {
  buildFinalFatalityFrame,
  renderDirectionalFrame,
  type DirectionalFrameSpec,
} from './asciiUtils.js';

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
    /** Нужен только финальной GAME OVER-сцене (цель раунда настраивается 3–50). */
    finishThreshold?: number;
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
            labels: [{ row: 1, text: 'БОЙ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ВСТУПАЕТ!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'В АТАКУ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'УДАР!!', align: 'center' }],
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
            labels: [{ row: 1, text: '* БАХ! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПОБЕДА!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ПРОПУЩЕН ЗВОНОК...', align: 'center' }],
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
            labels: [{ row: 1, text: 'ТАБУН!', align: 'center' }],
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
            labels: [{ row: 1, text: 'БЕГИ!!', align: 'loser' }],
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
            labels: [{ row: 1, text: '* ЗАТОПТАН! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'НОКАУТ ЛОШАДЬЮ', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПОБЕДА!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ЗОВУ Т-РЕКСА', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ТОП! ТОП!', align: 'center' }],
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
            labels: [{ row: 1, text: 'РРРРЫЫЫЫ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПОМОГИТЕ!', align: 'loser' }],
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
            labels: [{ row: 1, text: 'ХРУСЬ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЯМ-ЯМ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ДИНО ПОБЕДИЛ!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ТУ-ТУУ...', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПОЕЗД ПРИБЫВАЕТ', align: 'center' }],
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
            labels: [{ row: 1, text: 'ТУ-ТУУУ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ТОРМОЗОВ НЕТ!', align: 'center' }],
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
            labels: [{ row: 1, text: '* БАБАХ! БДЫЩ! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПРЯМОЕ ПОПАДАНИЕ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЭКСПРЕСС-НОКАУТ', align: 'center' }],
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
            labels: [{ row: 1, text: 'РЕЖИМ НИНДЗЯ', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ИСЧЕЗ...', align: 'center' }],
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
            labels: [{ row: 1, text: 'СЮРИКЕНЫ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ОН ЗА СПИНОЙ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'РЕЖЬ! РЕЖЬ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'КРИТ-НОКАУТ', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЧИСТАЯ ПОБЕДА', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ЗОВУ АРМИЮ!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'МАРШ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЗА СПАРТУ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ОКРУЖАЙ ЕГО!', align: 'center' }],
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
            labels: [{ row: 1, text: 'АТАКА РОЕМ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'СВЯЗАН!', align: 'center' }],
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
            labels: [{ row: 1, text: 'АРМИЯ ПОБЕДИЛА', align: 'winner' }],
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
            labels: [{ row: 1, text: 'СМОТРИ ВВЕРХ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЛЕТИТ СЮДА!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'МЕТЕОРИТ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ОЙ-ОЙ-ОЙ!!', align: 'loser' }],
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
            labels: [{ row: 1, text: 'ВБИТ В КРАТЕР!', align: 'center' }],
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
            labels: [{ row: 1, text: 'НОКАУТ С НЕБА', align: 'winner' }],
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
            labels: [{ row: 1, text: 'НЛО НА РАДАРЕ', align: 'center' }],
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
            labels: [{ row: 1, text: 'НАВОЖУСЬ...', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЛУЧ ВКЛЮЧЁН!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПОМОГИТЕ!', align: 'loser' }],
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
            labels: [{ row: 1, text: 'ПОХИЩЕН!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ИСЧЕЗ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'КОСМО-НОКАУТ', align: 'winner' }],
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
              { row: 1, text: 'ХАККЭЁЙ!', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  РИНГ СУМО  ]' },
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
              { row: 1, text: 'ДОСУКОЙ!!', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  РИНГ СУМО  ]' },
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
              { row: 1, text: 'ТЯЖЁЛЫЙ НАТИСК!', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  РИНГ СУМО  ]' },
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
              { row: 1, text: '* БАМ! *', align: 'center' },
              { row: 5, col: 6, flipCol: true, text: '[  РИНГ СУМО  ]' },
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
              { row: 1, text: 'ВЫТОЛКНУТ!!', align: 'center' },
              { row: 5, col: 4, flipCol: true, text: '[  РИНГ СУМО  ]' },
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
              { row: 1, text: 'ПЛЮХ!', align: 'center' },
              { row: 5, col: 4, flipCol: true, text: '[  РИНГ СУМО  ]' },
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
              { row: 1, text: 'ПОБЕДА ЁКОДЗУНЫ', align: 'winner' },
              { row: 5, col: 4, flipCol: true, text: '[  РИНГ СУМО  ]' },
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
            labels: [{ row: 1, text: 'ВОДА ПРИБЫВАЕТ...', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЦУНАМИ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'БОЛЬШАЯ ВОЛНА!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПЛЫВИ!!', align: 'loser' }],
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
            labels: [{ row: 1, text: 'СМЫТ ВОЛНОЙ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'БУЛЬК-БУЛЬК!', align: 'center' }],
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
            labels: [{ row: 1, text: 'СМЫЛО ВСЁ!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'АБРА...', align: 'center' }],
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
            labels: [{ row: 1, text: 'КАДАБРА!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЖАХ!!', align: 'center' }],
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
            labels: [{ row: 1, text: '* ПУФ! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'КВА?!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ЖАБЬЕ ПРОКЛЯТИЕ', align: 'winner' }],
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
            labels: [{ row: 1, text: 'КО-КО-КО?!', align: 'center' }],
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
            labels: [{ row: 1, text: 'МЕГА-КУРИЦА!', align: 'center' }],
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
            labels: [{ row: 1, text: 'КУД-КУДАХ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'КЛЮЙ! КЛЮЙ!', align: 'center' }],
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
            labels: [{ row: 1, text: '* КУДАХ-БАМ! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'УНЕСЁН!', align: 'center' }],
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
            labels: [{ row: 1, text: 'КУРИНЫЙ НОКАУТ', align: 'winner' }],
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
    description: 'Над игроком появляется красная кнопка с отсчётом 3... 2... 1... БУМ!',
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
              { row: 1, text: 'ЖМИ!', align: 'winner' },
              { row: 2, col: 23, flipCol: true, text: '[КНП]' },
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
            labels: [{ row: 1, text: 'ТИК... 3', align: 'center' }],
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
            labels: [{ row: 1, text: 'ТАК... 2', align: 'center' }],
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
            labels: [{ row: 1, text: '1... БЕГИ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ПЕПЕЛ...', align: 'center' }],
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
            labels: [{ row: 1, text: 'БУМ! НОКАУТ!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ДЗИНЬ-ДЗИНЬ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ДЖАБ! ДЖАБ!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ХУК!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'АППЕРКОТ!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ВТОРОЙ НА ПОЛУ!', align: 'center' }],
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
              { row: 1, text: 'НОКАУТ!', align: 'winner' },
              { row: 3, col: 8, flipCol: true, text: 'ЧЕМПИОН!' },
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
            labels: [{ row: 1, text: 'ДЁРНИ РЫЧАГ!', align: 'center' }],
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
            labels: [{ row: 1, text: '* ЩЁЛК! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'УУУУХ!!', align: 'loser' }],
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
            labels: [{ row: 1, text: 'ПАДАЕТ...', align: 'center' }],
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
            labels: [{ row: 1, text: 'ААААААаааа...', align: 'center' }],
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
            labels: [{ row: 1, text: 'НОКАУТ В ПОДВАЛЕ', align: 'center' }],
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
            labels: [{ row: 1, text: 'В ЛОВУШКЕ!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },
];
