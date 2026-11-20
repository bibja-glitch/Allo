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
  // 16. Falling Wardrobe
  {
    id: 'falling_wardrobe',
    title: '🗄️ Падающий шкаф',
    type: 'absurd',
    description: 'Прямо сверху на игнорщика приземляется дубовый шкаф.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'DELIVERY!', align: 'winner' }],
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
              { row: 1, text: 'WATCH OUT!', align: 'center' },
              { row: 2, col: 23, flipCol: true, text: '|SHKAF!|' },
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
              { row: 1, text: 'CRASH!!', align: 'center' },
              { row: 3, col: 23, flipCol: true, text: '|SHKAF!|' },
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
              { row: 1, text: '* B A M ! *', align: 'center' },
              { row: 3, col: 23, flipCol: true, text: '|SHKAF!|' },
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
              { row: 1, text: 'PACKED IN!', align: 'center' },
              { row: 3, col: 23, flipCol: true, text: '|SHKAF!|' },
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
              { row: 1, text: 'FLATPACK K.O.', align: 'winner' },
              { row: 3, col: 23, flipCol: true, text: '|SHKAF!|' },
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
              { row: 1, text: 'WARDROBE WIN!', align: 'winner' },
              { row: 3, col: 23, flipCol: true, text: '[LOCKED]' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 17. Robot Uprising
  {
    id: 'robot_uprising',
    title: '🤖 Восстание роботов',
    type: 'sci_fi',
    description: 'Отряд боевых роботов с лазерами окружает не отвечающего на звонок.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'BOOTING BOTS...', align: 'winner' }],
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
            labels: [{ row: 1, text: 'BEEP BOOP!', align: 'center' }],
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
            labels: [{ row: 1, text: 'TARGET LOCKED', align: 'center' }],
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
            labels: [{ row: 1, text: 'ZAP! PEW!', align: 'center' }],
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
            labels: [{ row: 1, text: 'TERMINATED!', align: 'center' }],
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
            labels: [{ row: 1, text: 'CYBER K.O.', align: 'winner' }],
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
            labels: [{ row: 1, text: 'ROBO VICTORY!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 18. Giant Snowball
  {
    id: 'giant_snowball',
    title: '❄️ Снежный ком',
    type: 'disaster',
    description: 'Маленький снежок превращается в огромную лавину и закатывает врага.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'SNOWBALL?!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ROLLING...', align: 'center' }],
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
            labels: [{ row: 1, text: 'GETTING BIG!', align: 'center' }],
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
            labels: [{ row: 1, text: 'AVALANCHE!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ROLLED OVER!', align: 'center' }],
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
            labels: [{ row: 1, text: 'SNOWMAN NOW!', align: 'center' }],
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
            labels: [{ row: 1, text: 'FROZEN K.O.!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 19. Alien Tentacles
  {
    id: 'alien_tentacles',
    title: '🐙 Инопланетные щупальца',
    type: 'sci_fi',
    description: 'Из портала вылезают щупальца и утаскивают не взявшего трубку.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'PORTAL OPEN!', align: 'center' }],
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
            labels: [{ row: 1, text: 'WHAT IS THAT?!', align: 'center' }],
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
            labels: [{ row: 1, text: 'TENTACLES!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'GRABBED!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'SLURP!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'PORTAL CLOSED', align: 'center' }],
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
            labels: [{ row: 1, text: 'DIMENSION K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 20. Volcano Eruption
  {
    id: 'volcano_eruption',
    title: '🌋 Извержение вулкана',
    type: 'disaster',
    description: 'Под вторым игроком вырастает вулкан и запускает его в стратосферу.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'RUMBLE...', align: 'center' }],
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
            labels: [{ row: 1, text: 'FLOOR IS HOT!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ERUPTING!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'LAVA LAUNCH!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'TO THE MOON!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ORBIT ACHIEVED', align: 'center' }],
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
            labels: [{ row: 1, text: 'VOLCANO K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 21. Giant Spider
  {
    id: 'giant_spider',
    title: '🕷️ Нападение гигантского паука',
    type: 'animal',
    description: 'Гигантский паук спускается на паутине сверху и заматывает игрока в кокон.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'CREEPY...', align: 'center' }],
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
            labels: [{ row: 1, text: 'SPIDER!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'GET IT OFF!!', align: 'loser' }],
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
            labels: [{ row: 1, text: 'WEB WRAP!', align: 'center' }],
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
            labels: [{ row: 1, text: 'COCOONED!', align: 'center' }],
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
            labels: [{ row: 1, text: 'HOISTED UP!', align: 'center' }],
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
            labels: [{ row: 1, text: 'SPIDER K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 22. Cliff Fall
  {
    id: 'cliff_fall',
    title: '🏔️ Падение с горы',
    type: 'duel',
    description: 'THIS IS SPARTA! Победитель сталкивает игнорщика со скалы.',
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
              '   O                O           ',
              '  /|\\              /|\\          ',
              '  / \\              / \\          ',
              '======================\\         ',
              '                       \\        ',
              '                        \\_______',
            ],
            labels: [{ row: 1, text: 'ON THE EDGE!', align: 'center' }],
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
            labels: [{ row: 1, text: 'THIS IS...', align: 'center' }],
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
            labels: [{ row: 1, text: 'SPARTA!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'KICKED!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'BYEEEE!', align: 'center' }],
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
            labels: [{ row: 1, text: '* SPLAT! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'CLIFF K.O.!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 23. Pirate Cannon Broadside
  {
    id: 'pirate_broadside',
    title: '🏴‍☠️ Пиратский залп из пушки',
    type: 'absurd',
    description: 'Победитель заряжает пушку и запускает ядро прямо в не взявшего трубку.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'LOAD CANNON!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'LIGHT FUSE!', align: 'center' }],
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
            labels: [{ row: 1, text: 'FIRE!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'INCOMING!', align: 'center' }],
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
            labels: [{ row: 1, text: 'DIRECT HIT!', align: 'center' }],
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
            labels: [{ row: 1, text: 'MAN OVERBOARD!', align: 'center' }],
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
            labels: [{ row: 1, text: 'PIRATE K.O.!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 24. Giant Ghost Scare
  {
    id: 'giant_ghost',
    title: '👻 Огромное привидение',
    type: 'magic',
    description: 'Гигантское привидение пугает игрока до обморока.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'SPOOKY NIGHT...', align: 'center' }],
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
            labels: [{ row: 1, text: 'WHOOooo...', align: 'center' }],
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
            labels: [{ row: 1, text: 'BOO!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'BOOOOOO!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'FAINTED!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'SCARED STIFF!', align: 'center' }],
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
            labels: [{ row: 1, text: 'GHOST K.O.!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 25. Rocket Crash
  {
    id: 'rocket_crash',
    title: '🚀 Падение ракеты',
    type: 'transport',
    description: 'Неуправляемая ракета падает по диагонали и взрывает игнорщика.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'LAUNCHED!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'LOST CONTROL!', align: 'center' }],
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
            labels: [{ row: 1, text: 'MAYDAY!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'BRACE!!', align: 'loser' }],
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
            labels: [{ row: 1, text: 'IMPACT BOOM!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'TOUCHDOWN!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ROCKET K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 26. Falling Piano
  {
    id: 'falling_piano',
    title: '🎹 Падающий рояль',
    type: 'absurd',
    description: 'Классический мультяшный рояль падает с крыши прямо на голову.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
              { row: 1, text: 'CUT ROPE!', align: 'winner' },
              { row: 2, col: 23, flipCol: true, text: '[PIANO]' },
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
            labels: [{ row: 1, text: 'DO RE MI...', align: 'center' }],
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
            labels: [{ row: 1, text: '* PLINK! *', align: 'center' }],
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
            labels: [{ row: 1, text: '* B A N G ! *', align: 'center' }],
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
            labels: [{ row: 1, text: 'MUSICAL K.O.!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ENCORE!!', align: 'center' }],
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
              { row: 1, text: 'PIANO WINS!', align: 'winner' },
              { row: 4, col: 22, flipCol: true, text: '[PIANO]' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 27. Laser Cat
  {
    id: 'laser_cat',
    title: '🐱 Кот с лазерами из глаз',
    type: 'animal',
    description: 'Гигантский кот стреляет лазерными лучами из глаз и испепеляет цель.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
            labels: [{ row: 1, text: 'MEOW?', align: 'center' }],
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
            labels: [{ row: 1, text: 'CHARGING EYES!', align: 'center' }],
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
            labels: [{ row: 1, text: 'LASER MEOW!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'ZAAAP!!', align: 'center' }],
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
            labels: [{ row: 1, text: '* PURR-FECT *', align: 'center' }],
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
            labels: [{ row: 1, text: 'GOOD KITTY!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'CAT LASER K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 28. Cactus & Tumbleweed
  {
    id: 'cactus_tumbleweed',
    title: '🌵 Дуэль на Диком Западе',
    type: 'duel',
    description: 'Перекати-поле пролетает между игроками, и быстрый ковбой стреляет первым.',
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
              '  _n_                      _n_  ',
              '   O                        O   ',
              '  /|\\      (@@@)           /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'HIGH NOON...', align: 'center' }],
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
            labels: [{ row: 1, text: 'WAIT FOR IT...', align: 'center' }],
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
            labels: [{ row: 1, text: 'DRAW!! BANG!', align: 'center' }],
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
            labels: [{ row: 1, text: 'PEW!', align: 'center' }],
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
            labels: [{ row: 1, text: 'BULLSEYE!', align: 'center' }],
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
            labels: [{ row: 1, text: 'FASTEST HAND!', align: 'winner' }],
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
            labels: [{ row: 1, text: 'WESTERN K.O.', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 29. Disco Fever
  {
    id: 'disco_fever',
    title: '🪩 Смертельное диско',
    type: 'absurd',
    description: 'Диско-шар ослепляет игрока стробоскопами, и он проигрывает танц-баттл.',
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
              '              (###)             ',
              '   O          (###)         O   ',
              '  /|\\                      /|\\  ',
              '  / \\                      / \\  ',
              '________________________________',
            ],
            labels: [{ row: 1, text: 'DISCO TIME!', align: 'center' }],
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
            labels: [{ row: 1, text: 'BOOGIE!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'DANCE BATTLE!', align: 'center' }],
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
            labels: [{ row: 1, text: 'MEGA FLASH!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'OUT-DANCED!!', align: 'center' }],
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
            labels: [{ row: 1, text: 'FUNKY K.O.!', align: 'center' }],
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
            labels: [{ row: 1, text: 'DISCO KING!', align: 'winner' }],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },

  // 30. Rogue Vacuum Cleaner
  {
    id: 'rogue_vacuum',
    title: '🧹 Безумный пылесос',
    type: 'absurd',
    description: 'Гигантский пылесос включается на турбо-режим и засасывает игнорщика.',
    frameDelayMs: 950,
    durationMs: 950 * 8,
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
              { row: 1, text: 'POWER ON!', align: 'winner' },
              { row: 3, col: 6, flipCol: true, text: '[VAC]' },
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
              { row: 1, text: 'TURBO SUCTION!', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[VAC]' },
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
              { row: 1, text: 'WHOOOOSH!!', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[VAC]' },
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
              { row: 1, text: 'NOOOOOO!!', align: 'loser' },
              { row: 3, col: 6, flipCol: true, text: '[VAC]' },
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
              { row: 1, text: '* SHLOOP! *', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[VAC]' },
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
              { row: 1, text: 'CLEANED UP!', align: 'center' },
              { row: 3, col: 6, flipCol: true, text: '[*VAC*]' },
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
              { row: 1, text: 'VACUUM K.O.!', align: 'winner' },
              { row: 3, col: 6, flipCol: true, text: '[VAC]' },
            ],
          },
        ],
        winnerSide,
        winnerName,
        loserName
      ),
  },
];
