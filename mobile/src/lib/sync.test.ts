import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "./api";
import type { PendingVisit } from "../types";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));
vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return { ...actual, apiRequest: apiRequestMock };
});

const { removePendingVisitMock, getPendingVisitsMock } = vi.hoisted(() => ({
  removePendingVisitMock: vi.fn(),
  getPendingVisitsMock: vi.fn(),
}));
vi.mock("./offline-queue", () => ({
  getPendingVisits: getPendingVisitsMock,
  removePendingVisit: removePendingVisitMock,
}));

const { showToastMock } = vi.hoisted(() => ({ showToastMock: vi.fn() }));
vi.mock("./toast", () => ({ showToast: showToastMock }));

const { syncPendingVisits } = await import("./sync");

function pendingVisit(localId: string, name: string): PendingVisit {
  return {
    localId,
    qrToken: `TCC-${localId}`,
    latitude: -26.2288,
    longitude: -51.0895,
    clientRecordedAt: new Date().toISOString(),
    attractionNameGuess: name,
  };
}

describe("syncPendingVisits", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    removePendingVisitMock.mockReset();
    getPendingVisitsMock.mockReset();
    showToastMock.mockReset();
  });

  it("remove da fila e avisa o usuario em falha DEFINITIVA (400 - fora do raio)", async () => {
    getPendingVisitsMock.mockResolvedValue([pendingVisit("v1", "Praca Central")]);
    apiRequestMock.mockRejectedValue(
      new ApiError(400, "Voce esta a 120m do atrativo. Aproxime-se ate 60m para registrar a visita.")
    );

    const result = await syncPendingVisits("token");

    expect(removePendingVisitMock).toHaveBeenCalledWith("v1");
    expect(showToastMock).toHaveBeenCalledTimes(1);
    expect(showToastMock.mock.calls[0][0]).toContain("Visita descartada");
    expect(showToastMock.mock.calls[0][0]).toContain("120m");
    expect(result.discardedMessages).toHaveLength(1);
    expect(result.failedCount).toBe(0);
    expect(result.syncedCount).toBe(0);
  });

  it("remove da fila e avisa o usuario em falha DEFINITIVA (404 - atrativo inexistente/desativado)", async () => {
    getPendingVisitsMock.mockResolvedValue([pendingVisit("v2", "Cachoeira Sumida")]);
    apiRequestMock.mockRejectedValue(
      new ApiError(404, "QR Code nao corresponde a nenhum atrativo ativo")
    );

    const result = await syncPendingVisits("token");

    expect(removePendingVisitMock).toHaveBeenCalledWith("v2");
    expect(showToastMock).toHaveBeenCalledTimes(1);
    expect(showToastMock.mock.calls[0][0]).toContain("nao encontrado ou desativado");
    expect(result.discardedMessages).toHaveLength(1);
  });

  it("MANTEM o item na fila em falha de rede (TRANSITORIA)", async () => {
    getPendingVisitsMock.mockResolvedValue([pendingVisit("v3", "Monumento")]);
    apiRequestMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await syncPendingVisits("token");

    expect(removePendingVisitMock).not.toHaveBeenCalled();
    expect(showToastMock).not.toHaveBeenCalled();
    expect(result.failedCount).toBe(1);
    expect(result.discardedMessages).toHaveLength(0);
  });

  it("MANTEM o item na fila em erro 5xx (TRANSITORIA)", async () => {
    getPendingVisitsMock.mockResolvedValue([pendingVisit("v4", "Museu")]);
    apiRequestMock.mockRejectedValue(new ApiError(500, "Erro interno do servidor"));

    const result = await syncPendingVisits("token");

    expect(removePendingVisitMock).not.toHaveBeenCalled();
    expect(result.failedCount).toBe(1);
  });

  it("MANTEM o item na fila em 401/403 (sessao expirada)", async () => {
    getPendingVisitsMock.mockResolvedValue([pendingVisit("v5", "Trilha")]);
    apiRequestMock.mockRejectedValue(new ApiError(401, "Nao autenticado"));

    const result = await syncPendingVisits("token");

    expect(removePendingVisitMock).not.toHaveBeenCalled();
    expect(result.failedCount).toBe(1);
  });

  it("um item que falha nao impede o processamento dos seguintes", async () => {
    getPendingVisitsMock.mockResolvedValue([
      pendingVisit("v6", "Atrativo A"),
      pendingVisit("v7", "Atrativo B"),
      pendingVisit("v8", "Atrativo C"),
    ]);
    apiRequestMock
      .mockRejectedValueOnce(new ApiError(400, "Fora do raio"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ visit: { id: "x" }, unlockedAchievements: [] });

    const result = await syncPendingVisits("token");

    expect(apiRequestMock).toHaveBeenCalledTimes(3);
    expect(removePendingVisitMock).toHaveBeenCalledWith("v6"); // 400 -> removido
    expect(removePendingVisitMock).not.toHaveBeenCalledWith("v7"); // rede -> mantido
    expect(removePendingVisitMock).toHaveBeenCalledWith("v8"); // sucesso -> removido
    expect(result.syncedCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.discardedMessages).toHaveLength(1);
  });
});
