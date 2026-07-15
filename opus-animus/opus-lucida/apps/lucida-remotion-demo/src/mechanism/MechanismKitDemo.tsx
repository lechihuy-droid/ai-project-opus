import { AbsoluteFill, Sequence } from "remotion";
import { ContextChip } from "./ContextChip";
import { DiffHighlight } from "./DiffHighlight";
import { MechanismWindow } from "./MechanismWindow";
import { TimerMorph } from "./TimerMorph";
import { mechanismFontFamily } from "./font";
import { mechanismTokens } from "./tokens";

export const MECHANISM_DEMO_BLOCK_FRAMES = 90;
export const MECHANISM_KIT_DEMO_DURATION = MECHANISM_DEMO_BLOCK_FRAMES * 4;

const DemoStage: React.FC<{ name: string; children: React.ReactNode }> = ({
  name,
  children,
}) => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: mechanismTokens.color.graphite,
      backgroundImage:
        "radial-gradient(circle at 50% 24%, rgba(210, 180, 122, 0.13), transparent 45%)",
      fontFamily: mechanismFontFamily,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 94,
        left: 72,
        color: mechanismTokens.color.champagneGold,
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: 5,
      }}
    >
      MECHANISM KIT / {name}
    </div>
    {children}
  </AbsoluteFill>
);

export const MechanismKitDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: mechanismTokens.color.graphite }}>
    <Sequence durationInFrames={MECHANISM_DEMO_BLOCK_FRAMES}>
      <DemoStage name="WINDOW">
        <MechanismWindow
          variant="email"
          title="取引先へのご連絡"
          japaneseText={"田中様\n資料を送ります。よろしくお願いします。"}
          vietnameseText="Anh Tanaka, tôi gửi tài liệu. Mong anh xem giúp."
        />
      </DemoStage>
    </Sequence>
    <Sequence
      from={MECHANISM_DEMO_BLOCK_FRAMES}
      durationInFrames={MECHANISM_DEMO_BLOCK_FRAMES}
    >
      <DemoStage name="CONTEXT CHIP">
        <div
          style={{
            width: 820,
            height: 330,
            borderRadius: mechanismTokens.radius.window,
            border: `2px dashed ${mechanismTokens.color.champagneGold}`,
            backgroundColor: mechanismTokens.color.graphiteSoft,
          }}
        />
        <ContextChip
          label="相手"
          value="Khách hàng Nhật"
          target={{ x: 0.5, y: 0.5 }}
        />
      </DemoStage>
    </Sequence>
    <Sequence
      from={MECHANISM_DEMO_BLOCK_FRAMES * 2}
      durationInFrames={MECHANISM_DEMO_BLOCK_FRAMES}
    >
      <DemoStage name="TIMER MORPH">
        <TimerMorph from="30:00" to="05:00" />
      </DemoStage>
    </Sequence>
    <Sequence
      from={MECHANISM_DEMO_BLOCK_FRAMES * 3}
      durationInFrames={MECHANISM_DEMO_BLOCK_FRAMES}
    >
      <DemoStage name="DIFF HIGHLIGHT">
        <DiffHighlight
          before={[
            { text: "資料を", highlight: "error", annotation: "direct" },
            { text: "送ります。" },
          ]}
          after={[
            { text: "資料を", highlight: "correction", annotation: "keigo" },
            { text: "お送りいたします。", highlight: "correction" },
          ]}
        />
      </DemoStage>
    </Sequence>
  </AbsoluteFill>
);
