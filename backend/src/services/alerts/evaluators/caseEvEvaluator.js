import prisma from '../../../prisma/prismaClient.js';

async function defaultCaseDataFetcher(caseId) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      skins: {
        include: { skin: true },
      },
    },
  });
}

export const caseEvEvaluator = {
  async evaluate(alert, { caseDataFetcher = defaultCaseDataFetcher } = {}) {
    const { evMarginPercent } = alert.config || {};
    if (typeof evMarginPercent !== 'number' || evMarginPercent <= 0) {
      return { triggered: false, payload: { reason: 'invalid evMarginPercent' } };
    }
    const caseId = alert.caseId ?? alert.case?.id;
    if (caseId == null) {
      return { triggered: false, payload: { reason: 'no caseId on alert' } };
    }
    const c = alert.case?.skins ? alert.case : await caseDataFetcher(caseId);
    if (!c) {
      return { triggered: false, payload: { reason: 'case not found' } };
    }
    if (c.price == null || c.price <= 0) {
      return { triggered: false, payload: { reason: 'case has no usable price' } };
    }
    if (!Array.isArray(c.skins) || c.skins.length === 0) {
      return { triggered: false, payload: { reason: 'case has no skins' } };
    }
    let ev = 0;
    for (const cs of c.skins) {
      const skinPrice = cs.skin?.priceLatest ?? 0;
      const chance = cs.dropChance ?? 0;
      ev += skinPrice * chance;
    }
    if (ev <= 0) {
      return { triggered: false, payload: { reason: 'EV is zero or negative' } };
    }
    const evMargin = ((ev - c.price) / ev) * 100;
    return {
      triggered: evMargin >= evMarginPercent,
      payload: {
        casePrice: c.price,
        expectedValue: Number(ev.toFixed(2)),
        evMargin: Number(evMargin.toFixed(2)),
        marginThreshold: evMarginPercent,
      },
    };
  },
};
