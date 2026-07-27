import { Haptics, ImpactStyle } from "@capacitor/haptics";

async function safeImpact(style: ImpactStyle) {
  try {
    await Haptics.impact({ style });
  } catch {
    // Dispositivo/navegador sem suporte a haptics - ignora silenciosamente.
  }
}

export const haptics = {
  light: () => safeImpact(ImpactStyle.Light),
  medium: () => safeImpact(ImpactStyle.Medium),
  heavy: () => safeImpact(ImpactStyle.Heavy),
  /** Sequencia "thump-tak" que imita um carimbo fisico batendo no papel. */
  async stamp() {
    await safeImpact(ImpactStyle.Heavy);
    setTimeout(() => safeImpact(ImpactStyle.Light), 100);
  },
};
