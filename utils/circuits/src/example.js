// Example circuits built through the same operations the GUI and CLI use.
import {createCircuit, apply} from './core.js';

function build(title, commands) {
  let d = createCircuit(title);
  for (const command of commands) d = apply(d, command);
  return d;
}
const add = (id, part, x, y, label, rotation = 0, props) => ({type: 'add', id, part, x, y, label, rotation, ...(props ? {props} : {})});
const wire = (id, from, to, extra = {}) => {
  const [fc, fp] = from.split('.'), [tc, tp] = to.split('.');
  return {type: 'connect', id, from: {component: fc, pin: fp}, to: {component: tc, pin: tp}, ...extra};
};

export const examples = [
  {title: 'Arduino LED 깜빡이', build: () => build('Arduino LED 깜빡이', [
    add('UNO', 'arduino-uno', 80, 160, 'Arduino Uno'),
    add('R1', 'resistor', 520, 90, 'R1', 0, {resistance: 220}),
    add('LED1', 'led', 700, 160, 'LED1'),
    wire('W1', 'UNO.D13', 'R1.1'),
    wire('W2', 'R1.2', 'LED1.A'),
    wire('W3', 'LED1.K', 'UNO.GND_2'),
  ])},
  {title: 'Arduino 스위치 입력 (풀다운)', build: () => build('Arduino 스위치 입력', [
    add('UNO', 'arduino-uno', 60, 200, 'Arduino Uno'),
    add('SW1', 'tact-switch', 560, 120, 'SW1'),
    add('R1', 'resistor', 620, 300, 'R1', 90, {resistance: 10000}),
    wire('W1', 'UNO.5V', 'SW1.1a'),
    wire('W2', 'SW1.2b', 'UNO.D2'),
    wire('W3', 'SW1.2b', 'R1.1'),
    wire('W4', 'R1.2', 'UNO.GND_1'),
  ])},
  {title: 'Raspberry Pi 5 + L298N + TT 모터', build: () => build('Raspberry Pi 5 DC 모터 제어', [
    add('PI', 'raspberry-pi-5', 60, 300, 'Raspberry Pi 5'),
    add('DRV', 'l298n', 640, 280, 'L298N 모터 드라이버'),
    add('ML', 'tt-motor', 600, 40, '왼쪽 모터', 0),
    add('MR', 'tt-motor', 880, 520, '오른쪽 모터', 180),
    wire('W1', 'PI.GPIO18', 'DRV.ENA'),
    wire('W2', 'PI.GPIO23', 'DRV.IN1'),
    wire('W3', 'PI.GPIO24', 'DRV.IN2'),
    wire('W4', 'PI.GPIO25', 'DRV.IN3'),
    wire('W5', 'PI.GPIO8', 'DRV.IN4'),
    wire('W6', 'PI.GPIO12', 'DRV.ENB'),
    wire('W7', 'PI.GND_6', 'DRV.GND'),
    wire('W8', 'ML.M+', 'DRV.OUT1'),
    wire('W9', 'ML.M-', 'DRV.OUT2'),
    wire('W10', 'MR.M+', 'DRV.OUT3'),
    wire('W11', 'MR.M-', 'DRV.OUT4'),
  ])},
  {title: 'Raspberry Pi 5 + MPU-6050 (I²C)', build: () => build('Raspberry Pi 5 I2C 가속도 센서', [
    add('PI', 'raspberry-pi-5', 60, 260, 'Raspberry Pi 5'),
    add('IMU', 'mpu6050', 560, 60, 'MPU-6050'),
    wire('W1', 'PI.3V3_1', 'IMU.VCC'),
    wire('W2', 'PI.GND_9', 'IMU.GND'),
    wire('W3', 'PI.GPIO3', 'IMU.SCL'),
    wire('W4', 'PI.GPIO2', 'IMU.SDA'),
  ])},
  {title: 'Raspberry Pi 5 + 카메라 + 2D 라이다', build: () => build('Raspberry Pi 5 카메라와 라이다', [
    add('PI', 'raspberry-pi-5', 260, 60, 'Raspberry Pi 5'),
    add('CAM', 'pi-camera', 100, 380, '카메라 모듈 3'),
    add('LIDAR', 'lidar-ld19p', 420, 360, 'LD19P 라이다'),
    add('UART', 'usb-uart-ld', 760, 400, 'USB-UART 어댑터'),
    wire('W1', 'CAM.CSI', 'PI.CAM0'),
    wire('W2', 'LIDAR.TX', 'UART.TX', {color: '#1f6fd1'}),
    wire('W3', 'LIDAR.GND', 'UART.GND'),
    wire('W4', 'LIDAR.P5V', 'UART.P5V'),
    wire('W5', 'UART.USB', 'PI.USB3'),
  ])},
  {title: 'Arduino + TB6612FNG + N20 모터', build: () => build('Arduino TB6612FNG 모터 제어', [
    add('UNO', 'arduino-uno', 60, 220, 'Arduino Uno'),
    add('DRV', 'tb6612fng', 520, 200, 'TB6612FNG'),
    add('MA', 'n20-motor', 700, 120, '모터 A'),
    add('MB', 'n20-motor', 700, 330, '모터 B'),
    wire('W1', 'UNO.D5', 'DRV.PWMA'),
    wire('W2', 'UNO.D7', 'DRV.AIN1'),
    wire('W3', 'UNO.D8', 'DRV.AIN2'),
    wire('W4', 'UNO.D9', 'DRV.STBY'),
    wire('W5', 'UNO.D10', 'DRV.BIN1'),
    wire('W6', 'UNO.D11', 'DRV.BIN2'),
    wire('W7', 'UNO.D6', 'DRV.PWMB'),
    wire('W8', 'UNO.GND_1', 'DRV.GND_L'),
    wire('W9', 'UNO.5V', 'DRV.VCC'),
    wire('W10', 'DRV.AO1', 'MA.M+'),
    wire('W11', 'DRV.AO2', 'MA.M-'),
    wire('W12', 'DRV.BO1', 'MB.M+'),
    wire('W13', 'DRV.BO2', 'MB.M-'),
  ])},
  {title: 'Arduino + 서보 + 스텝 모터', build: () => build('Arduino 서보·스텝 모터', [
    add('UNO', 'arduino-uno', 60, 300, 'Arduino Uno'),
    add('SERVO', 'servo-sg90', 120, 60, '서보 SG90'),
    add('ULN', 'uln2003', 640, 320, 'ULN2003'),
    add('STEP', 'stepper-28byj48', 640, 20, '28BYJ-48'),
    wire('W1', 'SERVO.SIG', 'UNO.D9'),
    wire('W2', 'SERVO.VCC', 'UNO.5V'),
    wire('W3', 'SERVO.GND', 'UNO.GND_1'),
    wire('W4', 'UNO.D8', 'ULN.IN1'),
    wire('W5', 'UNO.D10', 'ULN.IN2'),
    wire('W6', 'UNO.D11', 'ULN.IN3'),
    wire('W7', 'UNO.D12', 'ULN.IN4'),
    wire('W8', 'UNO.VIN', 'ULN.VCC'),
    wire('W9', 'UNO.GND_2', 'ULN.GND'),
    wire('W10', 'STEP.BLUE', 'ULN.OUT1', {color: '#1f6fd1'}),
    wire('W11', 'STEP.PINK', 'ULN.OUT2', {color: '#f48fb1'}),
    wire('W12', 'STEP.YELLOW', 'ULN.OUT3', {color: '#f2c200'}),
    wire('W13', 'STEP.ORANGE', 'ULN.OUT4', {color: '#e5672b'}),
    wire('W14', 'STEP.RED', 'ULN.COM', {color: '#d32f2f'}),
  ])},
];
export const exampleCircuit = () => examples[0].build();
