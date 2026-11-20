import {
  buildFinalFatalityFrame,
  renderDirectionalFrame,
  type DirectionalFrameSpec,
} from './asciiUtils.js';
import type { AsciiSceneDefinition } from './asciiScenesPart1.js';

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

export const ASCII_SCENES_PART_2: AsciiSceneDefinition[] = [
  {
    id: 'falling_wardrobe',
    title: 'Падающий шкаф',
    type: 'absurd',
    description: 'Прямо сверху на игнорщика приземляется дубовый шкаф.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'wardrobe'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                       [||||||] ',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ДОСТАВКА!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '                       |======| ',
              '   O                   |  ||  | ',
              '  /|\\                  |__||__| ',
              '  / \\                      O!   ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'ОСТОРОЖНО!', align: 'center' },
              { row: 2, col: 23, flipCol: true, text: '|ШКАФ!!|' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '   O                   |======| ',
              '  /|\\                  |  ||  | ',
              '  / \\                  |_\\O/__| ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'БАБАХ!!', align: 'center' },
              { row: 3, col: 23, flipCol: true, text: '|ШКАФ!!|' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '   O                  *|======|*',
              '  /|\\                 *|  ||  |*',
              '  / \\                 *|__||__|*',
              '________________________________',
            ],
            labels: [
              { row: 1, text: '* Б А М ! *', align: 'center' },
              { row: 3, col: 23, flipCol: true, text: '|ШКАФ!!|' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  |======| ',
              '   |                   |  ||  | ',
              '  / \\                 _|__||__|_ ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'УПАКОВАН!', align: 'center' },
              { row: 3, col: 23, flipCol: true, text: '|ШКАФ!!|' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  |======| ',
              '   |                   | o||o | ',
              '  / \\                 /_\\    /_\\',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'НОКАУТ МЕБЕЛЬЮ', align: 'winner' },
              { row: 3, col: 23, flipCol: true, text: '|ШКАФ!!|' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  [======] ',
              '   |                   |  ||  | ',
              '  / \\                  |__||__| ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'ШКАФ ПОБЕДИЛ!', align: 'winner' },
              { row: 3, col: 23, flipCol: true, text: '[ЗАХВАТ]' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'robot_uprising',
    title: 'Восстание роботов',
    type: 'sci_fi',
    description: 'Отряд боевых роботов с лазерами окружает не отвечающего на звонок.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'robots'],
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
            labels: [{ row: 1, text: 'ЗАПУСК БОТОВ...', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '      [o_o]                     ',
              '   O  /|#|\\                 O   ',
              '  /|\\  | |                 /|\\  ',
              '  / \\ _/ \\_                / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'БИП-БУП!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '      [o_o]  [o_o]              ',
              '   O  /|#|\\  /|#|\\          O!  ',
              '  /|\\  | |=====>           /|\\  ',
              '  / \\ _/ \\_  _/ \\_         / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЦЕЛЬ ЗАХВАЧЕНА', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '            [>_<]  [>_<]        ',
              '   O       /|#|\\--/|#|\\---*\\O/  ',
              '  /|\\       | |    | |  *!  |   ',
              '  / \\      _/ \\_  _/ \\_    / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЖАХ! ПИУ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '            [^_^]  [^_^]        ',
              '   O       /|#|\\  /|#|\\   * * * ',
              '  /|\\       | |    | |    __O__ ',
              '  / \\      _/ \\_  _/ \\_         ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'УНИЧТОЖЕН!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '     [v_v]                      ',
              '  \\O/ |#|                  * *  ',
              '   |  | |                 __x__ ',
              '  / \\_/ \\_                      ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'КИБЕР-НОКАУТ', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '     [^_^]                      ',
              '  \\O/ |#|                       ',
              '   |==| |                  _O_  ',
              '  / \\_/ \\_                      ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОБЕДА РОБОТОВ', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'giant_snowball',
    title: 'Снежный ком',
    type: 'disaster',
    description: 'Маленький снежок превращается в огромную лавину и закатывает врага.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'snowball'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O o                      O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'СНЕЖОК?!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '       .-.                      ',
              '   O  ( * )                 O   ',
              '  /|\\  `-`                 /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'КАТИТСЯ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '          .---.                 ',
              '   O     / * * \\            O!  ',
              '  /|\\   |  * *  |          /|\\  ',
              '  / \\    \\_____/           / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ВСЁ БОЛЬШЕ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '              .-----.           ',
              '   O         / * * * \\    \\O/   ',
              '  /|\\       | * * * * |    |    ',
              '  / \\        \\_______/    / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЛАВИНА!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                   .-------.    ',
              '   O              / * * * * \\   ',
              '  /|\\            | * *\\O/* * |  ',
              '  / \\             \\_________/   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПЕРЕКАТИЛО!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                        .-----. ',
              '  \\O/                  / * * * \\',
              '   |                  | *  O  * |',
              '  / \\                  \\__/|\\__/ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ТЕПЕРЬ СНЕГОВИК!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                    (o_o)  ',
              '   |      * *           (  *  ) ',
              '  / \\                   (_____) ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЗАМОРОЖЕН!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'alien_tentacles',
    title: 'Инопланетные щупальца',
    type: 'sci_fi',
    description: 'Из портала вылезают щупальца и утаскивают не взявшего трубку.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'monster'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O                   (( )) O  ',
              '  /|\\                  (( ))/|\\ ',
              '  / \\                       / \\ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОРТАЛ ОТКРЫТ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      ~\\        ',
              '   O                 ~~((O_O)O  ',
              '  /|\\                   (( ))/|\\',
              '  / \\                       / \\ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЧТО ЭТО?!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                    ~~~~\\       ',
              '   O               ((O_O)~~>O!  ',
              '  /|\\              (( ))~~>/|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЩУПАЛЬЦА!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                    ~~~~\\       ',
              '   O               ((O_O)~(\\O/) ',
              '  /|\\              (( ))~~(_|_) ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'СХВАЧЕН!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O               ((O\\O/))     ',
              '  /|\\              (( | ))      ',
              '  / \\                / \\        ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ХЛЮП!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                 (( ))     ',
              '   |                  (( ))     ',
              '  / \\                  * *      ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОРТАЛ ЗАКРЫТ', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                           ',
              '   |                    ~ ~ ~   ',
              '  / \\                           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОРТАЛ-НОКАУТ', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'volcano_eruption',
    title: 'Извержение вулкана',
    type: 'disaster',
    description: 'Под вторым игроком вырастает вулкан и запускает его в стратосферу.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'volcano'],
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
              '  / \\                     /^ ^\\ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ГРОХОТ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O                       O!   ',
              '  /|\\                     /|\\   ',
              '  / \\                   _/___\\_ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОЛ — ЛАВА!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                         ~ ~ ~  ',
              '   O                      \\O/   ',
              '  /|\\                    /^^^\\  ',
              '  / \\                   /     \\ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ИЗВЕРЖЕНИЕ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                        * \\O/ * ',
              '   O                   * * | * *',
              '  /|\\                    /^^^\\  ',
              '  / \\                   / * * \\ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЛАВА ЛЕТИТ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      \\O/   *   ',
              '   O                 * | *      ',
              '  /|\\                 /^^^\\     ',
              '  / \\                /     \\    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'НА ЛУНУ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                           *    ',
              '  \\O/                           ',
              '   |                  /^^^\\     ',
              '  / \\                /     \\    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ВЫШЕЛ НА ОРБИТУ', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                           ',
              '   |                  /^^^\\     ',
              '  / \\                /_____\\    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ВУЛКАН-НОКАУТ', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'giant_spider',
    title: 'Гигантский паук',
    type: 'animal',
    description: 'Гигантский паук спускается на паутине сверху и заматывает игрока в кокон.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'spider'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                           |    ',
              '   O                       |O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЖУТКО...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                          /|\\   ',
              '   O                     /(o)\\  ',
              '  /|\\                      O!   ',
              '  / \\                     /|\\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПАУК!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                           |    ',
              '   O                    /(o_o)\\ ',
              '  /|\\                   / \\O/ \\ ',
              '  / \\                     /|\\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'СНИМИТЕ ЭТО!!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '                           |    ',
              '   O                    /(^_^)\\ ',
              '  /|\\                   / \\#/ \\ ',
              '  / \\                    (#O#)  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'В ПАУТИНЕ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                           |    ',
              '   O                    /(^_^)\\ ',
              '  /|\\                    (###)  ',
              '  / \\                    (###)  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'В КОКОНЕ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                        /(^_^)\\ ',
              '  \\O/                    (###)  ',
              '   |                      | |   ',
              '  / \\                           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОДНЯТ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                         (###)  ',
              '  \\O/                    (###)  ',
              '   |      * *                   ',
              '  / \\                           ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПАУЧИЙ НОКАУТ', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'cliff_fall',
    title: 'Падение со скалы',
    type: 'duel',
    description: 'Победитель сталкивает игнорщика со скалы.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '   O                O           ',
              '  /|\\              /|\\          ',
              '  / \\              / \\          ',
              '======================\\         ',
              '                       \\        ',
              '                        \\_______',
            ],
            labels: [{ row: 1, text: 'НА КРАЮ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '          O         O           ',
              '         /|\\       /|\\          ',
              '         / \\       / \\          ',
              '======================\\         ',
              '                       \\        ',
              '                        \\_______',
            ],
            labels: [{ row: 1, text: 'ЭТО...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '               O===> O          ',
              '              /|\\   /|\\         ',
              '              / \\   / \\         ',
              '======================\\         ',
              '                       \\        ',
              '                        \\_______',
            ],
            labels: [{ row: 1, text: 'СПАРТА!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                O=*!  \\O/       ',
              '               /|\\     |        ',
              '               / \\    / \\       ',
              '======================\\         ',
              '                       \\        ',
              '                        \\_______',
            ],
            labels: [{ row: 1, text: 'ПИНОК!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                O               ',
              '               /|\\         \\O/  ',
              '               / \\          |   ',
              '======================\\    / \\  ',
              '                       \\        ',
              '                        \\_______',
            ],
            labels: [{ row: 1, text: 'ПОКАААА!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '               \\O/              ',
              '                |               ',
              '               / \\              ',
              '======================\\         ',
              '                       \\    *   ',
              '                        \\__*O*__',
            ],
            labels: [{ row: 1, text: '* ШЛЁП! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  \\O/                           ',
              '   |                            ',
              '  / \\                           ',
              '======================\\         ',
              '                       \\        ',
              '                        \\__xOx__',
            ],
            labels: [{ row: 1, text: 'НОКАУТ СО СКАЛЫ!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'pirate_broadside',
    title: 'Пиратский залп',
    type: 'absurd',
    description: 'Победитель заряжает пушку и запускает ядро прямо в не взявшего трубку.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'cannon'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O  [===]                 O   ',
              '  /|\\  | |                 /|\\  ',
              '  / \\ (o-o)                / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'ЗАРЯЖАЙ ПУШКУ!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '     *                          ',
              '   O  [===]                 O   ',
              '  /|\\  | |                 /|\\  ',
              '  / \\ (o-o)                / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'ПОДЖИГАЙ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O  [===]*  @==>          O!  ',
              '  /|\\  | |                 /|\\  ',
              '  / \\ (o-o)                / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'ОГОНЬ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O  [===]       @====>   \\O/  ',
              '  /|\\  | |                  |   ',
              '  / \\ (o-o)                / \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'ЛЕТИТ СЮДА!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                         \\ | /  ',
              '   O  [===]             * * * * ',
              '  /|\\  | |               * @ *  ',
              '  / \\ (o-o)              / | \\  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'ПРЯМОЕ ПОПАДАНИЕ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/ [===]              ~ ~ ~  ',
              '   |   | |                \\O/   ',
              '  / \\ (o-o)              ~~X~~  ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'ЧЕЛОВЕК ЗА БОРТОМ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/ [===]                     ',
              '   |   | |                      ',
              '  / \\ (o-o)               ~ ~ ~ ',
              '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
            ],
            labels: [{ row: 1, text: 'ПИРАТСКИЙ ЗАЛП!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'giant_ghost',
    title: 'Огромное привидение',
    type: 'magic',
    description: 'Гигантское привидение пугает игрока до обморока.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'ghost'],
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
            labels: [{ row: 1, text: 'ЖУТКАЯ НОЧЬ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '     .---.                      ',
              '    ( o o )                 O   ',
              '   O | O |                 /|\\  ',
              '  /|\\/\\/\\/                 / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'УУУуу...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '            .---.               ',
              '           ( O O )          O!  ',
              '   O       |  O  |         /|\\  ',
              '  /|\\      /\\/\\/\\/         / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'БУ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                  .---.         ',
              '                 ( > < )   \\O/! ',
              '   O             |  O  |    |   ',
              '  /|\\            /\\/\\/\\/   / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'БУУУУУ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                 .---.          ',
              '                ( ^ ^ )    *!*  ',
              '   O            |  -  |    \\O/  ',
              '  /|\\           /\\/\\/\\/   __|__ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ОБМОРОК!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '      .---.                     ',
              '  \\O/( ^ ^ )                    ',
              '   | /\\/\\/\\            ___O___  ',
              '  / \\                  / * * \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ОЦЕПЕНЕЛ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                           ',
              '   |      * *                   ',
              '  / \\                  __xOx__  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПРИЗРАЧНЫЙ УДАР!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'rocket_crash',
    title: 'Падение ракеты',
    type: 'transport',
    description: 'Неуправляемая ракета падает по диагонали и взрывает игнорщика.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'rocket'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '  ==>                           ',
              '  [====>                    O   ',
              '   O                       /|\\  ',
              '  /|\\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЗАПУЩЕН!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '       \\                        ',
              '        \\===\\               O   ',
              '   O     \\===>             /|\\  ',
              '  /|\\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'НЕТ КОНТРОЛЯ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O         \\===\\          O!  ',
              '  /|\\         \\===>        /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ТРЕВОГА!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O               \\===\\   \\O/  ',
              '  /|\\               \\===>   |   ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ДЕРЖИСЬ!!', align: 'loser' }],
          },
          {
            art: [
              '',
              '',
              '                      \\ | /     ',
              '   O                 * * * *    ',
              '  /|\\               * #X# *     ',
              '  / \\                / | \\      ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'УДАР! БУМ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       ~ ~      ',
              '  \\O/                 * # *     ',
              '   |                   \\ /      ',
              '  / \\                 _xOx_     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПРИЗЕМЛЕНИЕ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                           ',
              '   |      * *                   ',
              '  / \\                 __X__     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'РАКЕТНЫЙ УДАР', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'falling_piano',
    title: 'Падающий рояль',
    type: 'absurd',
    description: 'Классический мультяшный рояль падает с крыши прямо на голову.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'piano'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                       [=====]  ',
              '   O                        O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'РЕЖЬ ВЕРЁВКУ!', align: 'winner' },
              { row: 2, col: 23, flipCol: true, text: '[РОЯЛЬ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '                       |=====|  ',
              '   O                   |#####|  ',
              '  /|\\                      O!   ',
              '  / \\                     /|\\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ДО РЕ МИ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O                   |=====|  ',
              '  /|\\                  |#####|  ',
              '  / \\                  |\\O/__|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* ДЗИНЬ! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       *  *  *  ',
              '   O                  *|=====|* ',
              '  /|\\                 *|#####|* ',
              '  / \\                  |_|_|_|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* Т Р А Х ! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  |=====|  ',
              '   |                   |#####|  ',
              '  / \\                  \\O/ |    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'МУЗЫКАЛЬНЫЙ НОКАУТ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  [#####]  ',
              '   |                   | | | |  ',
              '  / \\                 __xOx__   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'НА БИС!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                           ',
              '   |                  [=====]   ',
              '  / \\                 __xOx__   ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'РОЯЛЬ ПОБЕДИЛ', align: 'winner' },
              { row: 4, col: 22, flipCol: true, text: '[РОЯЛЬ]' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'laser_cat',
    title: 'Кот с лазерами',
    type: 'animal',
    description: 'Гигантский кот стреляет лазерными лучами из глаз и испепеляет цель.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'cat'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '  /\\_/\\                         ',
              ' ( o.o )                    O   ',
              '  > ^ <                    /|\\  ',
              '   O                       / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'МЯУ?', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  /\\_/\\                         ',
              ' ( @.@ )                    O   ',
              '  > ^ <                    /|\\  ',
              '   O                       / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ГЛАЗА ЗАРЯЖАЮТСЯ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  /\\_/\\                         ',
              ' ( *.* )===========>        O!  ',
              '  > ^ <                    /|\\  ',
              '   O                       / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЛАЗЕР-МЯУ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  /\\_/\\                         ',
              ' ( *.* )==================>\\O/  ',
              '  > ^ <                     |   ',
              '   O                       / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЖЖЖАХ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  /\\_/\\                         ',
              ' ( *.* )================* * * * ',
              '  > ^ <                   *#*   ',
              '   O                      / \\   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* МУР-МУР! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  /\\_/\\                         ',
              ' ( ^.^ )                        ',
              '  > ^ <                ~ ~ ~    ',
              '  \\O/                  __xOx__  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ХОРОШИЙ КОТИК!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '  /\\_/\\                         ',
              ' ( ^.^ )                        ',
              '  \\O/                           ',
              '  / \\                  __xOx__  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'КОТО-НОКАУТ', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'cactus_tumbleweed',
    title: 'Дуэль на Западе',
    type: 'duel',
    description: 'Перекати-поле пролетает между игроками, и быстрый ковбой стреляет первым.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '  _n_                      _n_  ',
              '   O                        O   ',
              '  /|\\      (@@@)           /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОЛДЕНЬ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  _n_                      _n_  ',
              '   O                        O   ',
              '  /|\\           (@@@)      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЖДИ-ЖДИ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  _n_                      _n_  ',
              '   O====*                  /|\\  ',
              '  /|\\            (@@@)      O   ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЦЕЛЬСЯ!! БАХ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  _n_                      _n_  ',
              '   O=====*------>          \\O/  ',
              '  /|\\                       |   ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПИУ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  _n_                           ',
              '   O                     *! \\O/ ',
              '  /|\\                       |   ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'В ЯБЛОЧКО!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '  _n_                           ',
              '  \\O/                           ',
              '   |      ~ ~ ~                 ',
              '  / \\                 __O___    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'БЫСТРЕЕ ВСЕХ!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '  _n_                           ',
              '  \\O/                           ',
              '   |                 (@@@)      ',
              '  / \\                __xOx__    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ВЕСТЕРН-НОКАУТ', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'disco_fever',
    title: 'Смертельное диско',
    type: 'absurd',
    description: 'Диско-шар ослепляет игрока стробоскопами, и он проигрывает танц-баттл.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '              (###)             ',
              '   O          (###)         O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ВРЕМЯ ДИСКО!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '            * (###) *           ',
              '  \\O/       \\ (###) /       O   ',
              '   |                       /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ТАНЦУЙ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '          * * (###) * *         ',
              '   O/      \\ \\(###)/ /     \\O   ',
              '  /|                        |\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ТАНЦЕВАЛЬНЫЙ БАТЛ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '         \\  * (###) *  /        ',
              '  \\O/     \\  \\(###)/  /    O!   ',
              '   |                       /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'МЕГА-ВСПЫШКА!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '              (###)             ',
              '  \\O/         (###)     *  *  * ',
              '   |      * *           (X_X)   ',
              '  / \\                    /|\\    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПЕРЕТАНЦЕВАЛИ!!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '              (###)             ',
              '  \\O/                           ',
              '   |                     * * *  ',
              '  / \\                   __xOx__ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ФАНК-НОКАУТ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '              (###)             ',
              '  \\O/                           ',
              '   |                            ',
              '  / \\                   __xOx__ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'КОРОЛЬ ДИСКО!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  {
    id: 'rogue_vacuum',
    title: 'Безумный пылесос',
    type: 'absurd',
    description: 'Гигантский пылесос включается на турбо-режим и засасывает игнорщика.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'vacuum'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '',
              '   O  [===]                 O   ',
              '  /|\\ |===|=>              /|\\  ',
              '  / \\ o---o                / \\  ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'ВКЛЮЧЕНИЕ!', align: 'winner' },
              { row: 3, col: 6, flipCol: true, text: '[ПЫЛ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '   O  [===]   <<<<          O   ',
              '  /|\\ |===|=> <<<<         /|\\  ',
              '  / \\ o---o                / \\  ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'ТУРБО-ЗАСОС!', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[ПЫЛ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '   O  [===] <<<<<<<<      \\O/   ',
              '  /|\\ |===|=> <<<<<<       |    ',
              '  / \\ o---o               / \\   ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'ВЖУУУХ!!', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[ПЫЛ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '   O  [===]  <<<<\\O/            ',
              '  /|\\ |===|=> <<<<|             ',
              '  / \\ o---o      / \\            ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'НЕЕЕЕЕТ!!', align: 'loser' },
              { row: 3, col: 6, flipCol: true, text: '[ПЫЛ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '   O  [===] <\\O/                ',
              '  /|\\ |===|=> |                 ',
              '  / \\ o---o                     ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: '* ХЛЮП! *', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[ПЫЛ]' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/ [*===*]                   ',
              '   |  |(=_=)|    * * *          ',
              '  / \\ o-----o                   ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'УБРАН!', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[*ПЫЛ*]' },
            ],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/ [===]                     ',
              '   |  |===|                     ',
              '  / \\ o---o                     ',
              '________________________________',
            ],
            labels: [
              { row: 1, text: 'ПЫЛЕСОС-НОКАУТ', align: 'winner' },
              { row: 3, col: 6, flipCol: true, text: '[ПЫЛ]' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 31. Do Not Disturb Lock (New)
  {
    id: 'dnd_lock',
    title: 'Режим «Не беспокоить»',
    type: 'absurd',
    description: 'Тяжёлый стальной замок падает на игнорщика за беззвучный режим.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                        .---.   ',
              '   O                   /     \\  ',
              '  /|\\                  |  O  |  ',
              '  / \\                  | /|\\ |  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'БЕЗ ЗВУКА?', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '                       .-----.  ',
              '   O                   |  o  |  ',
              '  /|\\                  |_____|  ',
              '  / \\                     O!    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПАДАЕТ ЗАМОК!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O                   .-----.  ',
              '  /|\\                  |[===]|  ',
              '  / \\                  |\\O/__|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* КЛАЦ! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       *  *  *  ',
              '   O                   .-----.  ',
              '  /|\\                 *|[ # ]|* ',
              '  / \\                  |_____|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЗАБЛОКИРОВАН!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  .-----.  ',
              '   |                   |[###]|  ',
              '  / \\                  |_____|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'НЕТ ДОСТУПА', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  .-----.  ',
              '   |      ~ ~          |[ x ]|  ',
              '  / \\                  |_____|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'РЕЖИМ ТИШИНЫ', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                  .-----.  ',
              '   |                   |[   ]|  ',
              '  / \\                  |__x__|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЗАКРЫТО!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 32. Orbital Satellite Laser (New)
  {
    id: 'orbital_laser',
    title: 'Орбитальный удар',
    type: 'sci_fi',
    description: 'Спутник связи находит абонента и посылает точный импульс с орбиты.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser', 'satellite'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                     =[===]=    ',
              '   O                    v   O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОИСК СИГНАЛА...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      =[===]=   ',
              '   O                     |  O   ',
              '  /|\\                    : /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'АБОНЕНТ НАЙДЕН', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       =[===]=  ',
              '   O                      |     ',
              '  /|\\                     | O!  ',
              '  / \\                     |/ \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'НАВЕДЕНИЕ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       =[===]=  ',
              '   O                     |||    ',
              '  /|\\                    |||\\O/ ',
              '  / \\                    |||/|  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЗАРЯД 100%!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       =[===]=  ',
              '   O                    *|||*   ',
              '  /|\\                  * #X# *  ',
              '  / \\                    / \\    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* ИМПУЛЬС! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       =[===]=  ',
              '  \\O/                    ~ ~    ',
              '   |                     * *    ',
              '  / \\                  __xOx__  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'СВЯЗЬ ВОССТАНОВЛЕНА', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       =[===]=  ',
              '  \\O/                           ',
              '   |                            ',
              '  / \\                  __xOx__  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ОРБИТАЛЬНЫЙ НОКАУТ', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 33. Coffee Mug Trap (New)
  {
    id: 'coffee_mug_trap',
    title: 'Перерыв на кофе',
    type: 'absurd',
    description: 'Гигантская кружка кофе накрывает того, кто снова проигнорировал вызов.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
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
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПОРА ПРОСНУТЬСЯ', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '                      (~~~~)    ',
              '   O                  |    |]   ',
              '  /|\\                 |____|    ',
              '  / \\                      O!   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ДВОЙНОЙ ЭСПРЕССО!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '   O                  |~~~~|]   ',
              '  /|\\                 |    |    ',
              '  / \\                 |\\O/_|    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* ХЛЮП! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      ~  ~  ~   ',
              '   O                  |====|]   ',
              '  /|\\                 | *O*|    ',
              '  / \\                 |____|    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'НАКРЫЛО!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                       ~  ~     ',
              '  \\O/                 |====|]   ',
              '   |                  |    |    ',
              '  / \\                 |____|    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'БОДРОСТЬ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                 [====]]   ',
              '   |      * *         |    |    ',
              '  / \\                 |____|    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'КОФЕ-БРЕЙК!', align: 'winner' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                 [====]]   ',
              '   |                  | .. |    ',
              '  / \\                 |____|    ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ПРОСНУЛСЯ?', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 34. Lightning Bolt (New)
  {
    id: 'lightning_bolt',
    title: 'Разряд молнии',
    type: 'disaster',
    description: 'Над игнорщиком сгущается туча и бьёт точный электрический разряд.',
    frameDelayMs: 900,
    durationMs: 900 * 8,
    participants: ['winner', 'loser'],
    buildFrames: ({ winnerSide, winnerName, loserName }) =>
      compileDirectionalScene(
        [
          {
            art: [
              '',
              '',
              '                      (~~~~)    ',
              '   O                 (~~~~~~)O  ',
              '  /|\\                       /|\\ ',
              '  / \\                       / \\ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ГРОЗА ИДЁТ...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      (####)    ',
              '   O                 (######)O! ',
              '  /|\\                  /    /|\\ ',
              '  / \\                       / \\ ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ИСКРИТ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      (####)    ',
              '   O                 (######)   ',
              '  /|\\                   /\\ \\O/  ',
              '  / \\                    \\  |   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ЗАРЯД...', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      (####)    ',
              '   O                    /       ',
              '  /|\\                  /\\*!*\\O/ ',
              '  / \\                   / * |   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '* Т Р Е С К ! *', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '                      (~~~~)    ',
              '   O                    * *     ',
              '  /|\\                 * #X# *   ',
              '  / \\                   / \\     ',
              '________________________________',
            ],
            labels: [{ row: 1, text: '220 ВОЛЬТ!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                   ~ ~     ',
              '   |                  *  *  *   ',
              '  / \\                 __xOx__   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'ОГЛУШЁН!', align: 'center' }],
          },
          {
            art: [
              '',
              '',
              '',
              '  \\O/                           ',
              '   |                            ',
              '  / \\                 __xOx__   ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'РАЗРЯД ПОПАЛ!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },
];
