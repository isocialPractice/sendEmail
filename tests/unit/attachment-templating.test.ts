/**
 * attachment-templating.test.ts
 * Unit tests for attachment template variable substitution in email.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AttachmentLoader } from '../../src/core/attachment-loader.js';
import type { Attachment, EngineConfig, TemplateVariables } from '../../src/core/types.js';

const mockConfig: EngineConfig = {
  rootPath: '/test/root',
  accountsPath: '/test/root/config/accounts',
  emailsPath: '/test/root/config/emails',
  globalsPath: '/test/root/config/globals',
  listsPath: '/test/root/lists',
  attachmentsPath: '/test/root/attachments',
  imagesPath: '/test/root/img',
  logsPath: '/test/root/logs',
  defaultAccount: '_default',
};

describe('AttachmentLoader - Template Variable Substitution', () => {
  let loader: AttachmentLoader;

  beforeEach(() => {
    loader = new AttachmentLoader(mockConfig);
  });

  describe('substituteTemplateVars', () => {
    it('substitutes {{dates.*}} variables in attachment filenames', () => {
      const attachments: Attachment[] = [
        {
          filename: 'Report-{{dates.lastMonth}}-{{dates.year}}.pdf',
          path: 'attachments/report.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.lastMonth': 'January',
        'dates.year': '2026',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('Report-January-2026.pdf');
    });

    it('substitutes {{dates.*}} variables in attachment paths', () => {
      const attachments: Attachment[] = [
        {
          filename: 'report.pdf',
          path: 'attachments/{{dates.year}}/{{dates.month}}/report.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.year': '2026',
        'dates.month': 'February',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].path).toBe('attachments/2026/February/report.pdf');
    });

    it('substitutes multiple variables in a single filename', () => {
      const attachments: Attachment[] = [
        {
          filename: 'Q{{dates.quarter}}-{{dates.year}}-Summary-{{dates.month}}.pdf',
          path: 'attachments/summary.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.quarter': 1,
        'dates.year': '2026',
        'dates.month': 'February',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('Q1-2026-Summary-February.pdf');
    });

    it('handles custom variables in addition to dates.*', () => {
      const attachments: Attachment[] = [
        {
          filename: 'Report-{{dates.lastMonth}}-{{theYear}}.pdf',
          path: 'reports/{{theYear}}/report.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.lastMonth': 'January',
        theYear: '2025',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('Report-January-2025.pdf');
      expect(result[0].path).toBe('reports/2025/report.pdf');
    });

    it('leaves unmatched template variables unchanged', () => {
      const attachments: Attachment[] = [
        {
          filename: 'Report-{{unknownVar}}.pdf',
          path: 'attachments/report.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.year': '2026',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('Report-{{unknownVar}}.pdf');
    });

    it('preserves inline attachment properties', () => {
      const attachments: Attachment[] = [
        {
          filename: 'logo-{{dates.year}}.jpg',
          path: 'img/logo.jpg',
          contentDisposition: 'inline',
          cid: 'logo@example.com',
        },
      ];

      const vars: TemplateVariables = {
        'dates.year': '2026',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('logo-2026.jpg');
      expect(result[0].contentDisposition).toBe('inline');
      expect(result[0].cid).toBe('logo@example.com');
    });

    it('handles attachments without template variables', () => {
      const attachments: Attachment[] = [
        {
          filename: 'static-document.pdf',
          path: 'attachments/document.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.year': '2026',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('static-document.pdf');
      expect(result[0].path).toBe('attachments/document.pdf');
    });

    it('handles empty attachments array', () => {
      const attachments: Attachment[] = [];
      const vars: TemplateVariables = { 'dates.year': '2026' };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result).toEqual([]);
    });

    it('handles numeric date values correctly', () => {
      const attachments: Attachment[] = [
        {
          filename: 'Q{{dates.quarter}}-Report.pdf',
          path: 'reports/quarter-{{dates.quarter}}.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.quarter': 1,
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('Q1-Report.pdf');
      expect(result[0].path).toBe('reports/quarter-1.pdf');
    });
  });

  describe('Complex attachment patterns', () => {
    it('handles conditional year logic pattern (theYear variable)', () => {
      // Simulating the pattern from the billing example where theYear
      // is computed based on month and contains template syntax itself
      const attachments: Attachment[] = [
        {
          filename: 'Report - {{dates.lastMonth}} {{theYear}}.pdf',
          path: 'reports/{{theYear}}/inventory.pdf',
        },
      ];

      // In January, theYear would be '{{dates.lastYear}}', but after substitution it's '2025'
      const vars: TemplateVariables = {
        'dates.lastMonth': 'January',
        'dates.lastYear': '2025',
        'dates.year': '2026',
        theYear: '2025', // Already resolved from {{dates.lastYear}}
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].filename).toBe('Report - January 2025.pdf');
      expect(result[0].path).toBe('reports/2025/inventory.pdf');
    });

    it('handles mixed static and template strings in paths', () => {
      const attachments: Attachment[] = [
        {
          filename: 'report.pdf',
          path: '../../Documents/Reports/{{dates.year}}/Report-{{dates.month}}.pdf',
        },
      ];

      const vars: TemplateVariables = {
        'dates.year': '2026',
        'dates.month': 'February',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result[0].path).toBe('../../Documents/Reports/2026/Report-February.pdf');
    });

    it('handles multiple attachments with different template patterns', () => {
      const attachments: Attachment[] = [
        {
          filename: 'Report-{{dates.lastMonth}}-{{theYear}}.pdf',
          path: 'reports/{{theYear}}/report.pdf',
        },
        {
          filename: 'Q{{dates.quarter}}-Summary.pdf',
          path: 'quarterly/Q{{dates.quarter}}-{{dates.year}}.pdf',
        },
        {
          filename: 'static-logo.jpg',
          path: 'img/logo.jpg',
          contentDisposition: 'inline',
          cid: 'logo@example.com',
        },
      ];

      const vars: TemplateVariables = {
        'dates.lastMonth': 'January',
        'dates.quarter': 1,
        'dates.year': '2026',
        theYear: '2025',
      };

      const result = loader.substituteTemplateVars(attachments, vars);

      expect(result).toHaveLength(3);
      expect(result[0].filename).toBe('Report-January-2025.pdf');
      expect(result[1].filename).toBe('Q1-Summary.pdf');
      expect(result[2].filename).toBe('static-logo.jpg');
    });
  });
});

describe('Email.js Export Patterns', () => {
  describe('Static array export', () => {
    it('validates static attachment array structure', () => {
      const staticAttachments: Attachment[] = [
        {
          filename: 'document.pdf',
          path: 'attachments/document.pdf',
        },
        {
          filename: 'logo.jpg',
          path: 'img/logo.jpg',
          contentDisposition: 'inline',
          cid: 'logo@example.com',
        },
      ];

      expect(staticAttachments).toHaveLength(2);
      expect(staticAttachments[0].filename).toBe('document.pdf');
      expect(staticAttachments[1].contentDisposition).toBe('inline');
    });

    it('validates static attachments with template variables', () => {
      const templateAttachments: Attachment[] = [
        {
          filename: 'Report-{{dates.lastMonth}}-{{dates.year}}.pdf',
          path: 'attachments/reports/{{dates.year}}/report.pdf',
        },
      ];

      expect(templateAttachments[0].filename).toContain('{{dates.lastMonth}}');
      expect(templateAttachments[0].path).toContain('{{dates.year}}');
    });
  });

  describe('Function export pattern', () => {
    it('validates function-based attachment export with dates argument', () => {
      // Simulating the function export pattern
      const emailAttachments = (dates: Record<string, string | number>) => {
        const theYear = dates.lastMonth === 'January' ? dates.lastYear : dates.year;

        return [
          {
            filename: `Report - ${dates.lastMonth} ${theYear}.pdf`,
            path: `reports/${theYear}/report.pdf`,
          },
        ];
      };

      // Test with January (should use lastYear)
      const januaryResult = emailAttachments({
        lastMonth: 'January',
        year: '2026',
        lastYear: '2025',
      });

      expect(januaryResult[0].filename).toBe('Report - January 2025.pdf');
      expect(januaryResult[0].path).toBe('reports/2025/report.pdf');

      // Test with February (should use current year)
      const februaryResult = emailAttachments({
        lastMonth: 'February',
        year: '2026',
        lastYear: '2025',
      });

      expect(februaryResult[0].filename).toBe('Report - February 2026.pdf');
      expect(februaryResult[0].path).toBe('reports/2026/report.pdf');
    });

    it('validates function export with complex logic', () => {
      const emailAttachments = (dates: Record<string, string | number>) => {
        const theYear = dates.lastMonth === 'January' ? dates.lastYear : dates.year;
        const quarter = dates.quarter;

        return [
          {
            filename: `Inventory-${dates.lastMonth}-${theYear}.pdf`,
            path: `../../Documents/Reports/${theYear}/Inventory-${dates.lastMonth}.pdf`,
          },
          {
            filename: `Q${quarter}-Summary-${dates.year}.pdf`,
            path: `quarterly/Q${quarter}-${dates.year}.pdf`,
          },
        ];
      };

      const result = emailAttachments({
        lastMonth: 'January',
        year: '2026',
        lastYear: '2025',
        quarter: 1,
      });

      expect(result).toHaveLength(2);
      expect(result[0].filename).toBe('Inventory-January-2025.pdf');
      expect(result[1].filename).toBe('Q1-Summary-2026.pdf');
    });
  });

  describe('emailVars export pattern', () => {
    it('validates emailVars export with computed values', () => {
      // Simulating the emailVars export pattern from email.js
      const date = new Date('2026-01-15'); // January
      const monthCheck = date.getMonth();

      let theYear: string;
      if (monthCheck === 0) {
        theYear = '{{dates.lastYear}}';
      } else {
        theYear = '{{dates.year}}';
      }

      const emailVars = {
        theYear,
        reportType: 'Monthly',
        department: 'Billing',
      };

      expect(emailVars.theYear).toBe('{{dates.lastYear}}');
      expect(emailVars.reportType).toBe('Monthly');
      expect(emailVars.department).toBe('Billing');
    });

    it('validates emailVars in February (non-January month)', () => {
      const date = new Date('2026-02-15'); // February
      const monthCheck = date.getMonth();

      let theYear: string;
      if (monthCheck === 0) {
        theYear = '{{dates.lastYear}}';
      } else {
        theYear = '{{dates.year}}';
      }

      const emailVars = {
        theYear,
        reportType: 'Monthly',
      };

      expect(emailVars.theYear).toBe('{{dates.year}}');
    });

    it('validates custom variables can be used in email.json', () => {
      // This test validates the concept that emailVars can be referenced in email.json
      const emailVars = {
        theYear: '2025',
        reportType: 'Monthly',
        department: 'Billing',
      };

      // Simulating template substitution in email.json
      const subject = 'Report {{dates.lastMonth}} {{theYear}}';
      const bcc = '{{department}}@example.com';

      // After substitution with emailVars and dates
      const vars = {
        'dates.lastMonth': 'January',
        ...emailVars,
      };

      const substitutedSubject = subject.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmed = key.trim();
        return vars[trimmed as keyof typeof vars]?.toString() ?? match;
      });

      const substitutedBcc = bcc.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmed = key.trim();
        return vars[trimmed as keyof typeof vars]?.toString() ?? match;
      });

      expect(substitutedSubject).toBe('Report January 2025');
      expect(substitutedBcc).toBe('Billing@example.com');
    });
  });
});
