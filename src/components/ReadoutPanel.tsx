// 实时读数面板:支铰角度、连杆长度、活塞行程等
import { For, Show } from 'solid-js';
import { ROD_LENGTH } from '../config';
import { solveKinematics } from '../kinematics';
import { angle } from '../store';

export default function ReadoutPanel() {
  return (
    <div class="readout-panel">
      <div class="readout-row readout-head">
        <span>开度 θ</span>
        <b>{angle().toFixed(1)}°</b>
      </div>
      <For each={solveKinematics(angle()).sides}>
        {(sk) => (
          <div class="readout-side">
            <div class="readout-row">
              <span>{sk.side.name}支铰转角</span>
              <b>{sk.hingeRotationDeg.toFixed(1)}°</b>
            </div>
            <div class="readout-row">
              <span>{sk.side.name}连杆长度</span>
              <b>
                {sk.rodLength.toFixed(3)} m
                <span class="dim">(设计 {ROD_LENGTH.toFixed(2)})</span>
              </b>
            </div>
            <div class="readout-row">
              <span>{sk.side.name}活塞行程</span>
              <b>{sk.stroke.toFixed(3)} m</b>
            </div>
            <div class="readout-row">
              <span>{sk.side.name}活塞杆伸出</span>
              <b>{sk.rodExtension.toFixed(3)} m</b>
            </div>
            <Show when={!sk.reachable}>
              <div class="readout-warn">⚠ {sk.side.name}机构不可达(超出连杆行程范围)</div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
