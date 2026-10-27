// Built-in part library. Illustrations for teaching, not mechanical footprints.
import {basicParts} from './basic.js';
import {boardParts} from './boards.js';
import {breadboardParts} from './breadboard.js';
import {motorParts} from './motors.js';
import {moduleParts} from './modules.js';
import {extraParts} from './extras.js';
import {displayParts} from './displays.js';
import {kitParts} from './kits.js';

export const CATEGORIES = ['보드', '기본 소자', '모터', '모듈·센서', '전원', '디스플레이', '커스텀 (청소기)'];
export const builtinParts = [...boardParts, ...breadboardParts, ...basicParts, ...motorParts, ...moduleParts, ...extraParts, ...kitParts, ...displayParts];
