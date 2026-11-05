(function (root) {
  function createLink(items, gateMode = false) {
    const unfinished = items
      .map((item, index) => ({ id: gateMode ? index : item.id, progress: item.progress }))
      .filter(item => item.progress < 100)
      .sort((a, b) => a.progress - b.progress || a.id - b.id);
    if (unfinished.length < 2) return null;
    return { a: unfinished[0].id, b: unfinished[1].id, gateMode,
      transferredThisRound: 0, charge: 0, chargedRound: 0,
      skillUsedRound: 0, reconnectPending: false };
  }
  function transferAmount(actualGain, peerProgress) {
    if (!(actualGain > 0) || peerProgress >= 100) return 0;
    return Math.min(Math.max(1, Math.floor(actualGain * 0.25)), 100 - peerProgress);
  }
  function addRoundCharge(link, round, transferred) {
    if (!link || transferred <= 0 || link.chargedRound === round) return 0;
    link.chargedRound = round;
    if (link.charge >= 3) return 0;
    link.charge += 1; return 1;
  }
  function reconnect(link, items, gateMode = false) {
    const next = createLink(items, gateMode);
    if (!next) return null;
    if (link) {
      next.charge = link.charge;
      next.chargedRound = link.chargedRound;
      next.skillUsedRound = link.skillUsedRound;
    }
    return next;
  }
  const api = { createLink, transferAmount, addRoundCharge, reconnect };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LucaMechanics = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
