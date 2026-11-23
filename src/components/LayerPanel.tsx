import { For, Show } from 'solid-js';
import { config } from '../store';
import {
  setCoatingGear,
  setLayerEnabled,
  setLayerThickness,
  setTransmissionGear,
  thicknessBounds,
} from '../store';
import { GEAR_MAX, GEAR_MIN, TRANSMISSION_TABLE, COATING_TABLE } from '../optics';

interface Props {
  isolatedId: number | null;
  onIsolate: (id: number | null) => void;
}

function GearButtons(props: {
  value: number;
  kind: 'transmission' | 'coating';
  layerId: number;
}) {
  return (
    <div class="gear-row">
      <For each={Array.from({ length: GEAR_MAX - GEAR_MIN + 1 }, (_, i) => i + 1)}>
        {(gear) => (
          <button
            classList={{
              gear: true,
              active: props.value === gear,
              transmission: props.kind === 'transmission',
              coating: props.kind === 'coating',
            }}
            title={
              props.kind === 'transmission'
                ? `透射档位 ${gear}，T₀=${(TRANSMISSION_TABLE[gear] * 100).toFixed(0)}%`
                : `镀膜档位 ${gear}，F₀=${(COATING_TABLE[gear] * 100).toFixed(1)}%`
            }
            onClick={() =>
              props.kind === 'transmission'
                ? setTransmissionGear(props.layerId, gear)
                : setCoatingGear(props.layerId, gear)
            }
          >
            {gear}
          </button>
        )}
      </For>
    </div>
  );
}

export default function LayerPanel(props: Props) {
  return (
    <aside class="layer-panel">
      <div class="panel-header">
        <h2>玻璃层控制</h2>
        <span class="layer-count">{config.layerCount} 层</span>
      </div>
      <Show when={props.isolatedId !== null}>
        <div class="isolate-banner">
          已隔离第 {props.isolatedId! + 1} 层
          <button class="link-btn" onClick={() => props.onIsolate(null)}>
            退出隔离
          </button>
        </div>
      </Show>
      <div class="layer-list">
        <For each={config.layers}>
          {(layer) => (
            <div
              classList={{
                'layer-card': true,
                disabled: !layer.enabled,
                isolated: props.isolatedId === layer.id,
              }}
            >
              <div class="layer-title">
                <label class="enable-label" title="启用/停用该层">
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={(e) => setLayerEnabled(layer.id, e.currentTarget.checked)}
                  />
                  <span>第 {layer.id + 1} 层</span>
                </label>
                <button
                  class="isolate-btn"
                  classList={{ active: props.isolatedId === layer.id }}
                  title="高亮隔离该层（隐藏其余层）"
                  onClick={() =>
                    props.onIsolate(props.isolatedId === layer.id ? null : layer.id)
                  }
                >
                  隔离
                </button>
              </div>
              <div class="gear-block">
                <span class="gear-label">透射</span>
                <GearButtons value={layer.transmissionGear} kind="transmission" layerId={layer.id} />
              </div>
              <div class="gear-block">
                <span class="gear-label">镀膜</span>
                <GearButtons value={layer.coatingGear} kind="coating" layerId={layer.id} />
              </div>
              <div class="thickness-block">
                <span class="gear-label">厚度</span>
                <input
                  type="range"
                  min={thicknessBounds.min}
                  max={thicknessBounds.max}
                  step={0.001}
                  value={layer.thickness}
                  onInput={(e) => setLayerThickness(layer.id, Number(e.currentTarget.value))}
                />
                <span class="thickness-value">{(layer.thickness * 1000).toFixed(1)}mm</span>
              </div>
            </div>
          )}
        </For>
      </div>
    </aside>
  );
}
