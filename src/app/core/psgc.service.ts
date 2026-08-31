import { Injectable } from '@angular/core';
import { PSGC_DATA } from './psgc-data';

export interface PsgcNode { psgc_id: string; name: string; }

/**
 * Local, offline PSGC (Philippine Standard Geographic Code) lookup —
 * ported from the web app's js/modules/psgc.js. "psgc_id" values are
 * synthetic pipe-delimited paths (not official PSGC codes), used only
 * to chain the next lookup — e.g. "NCR|CITY OF MAKATI".
 */
@Injectable({ providedIn: 'root' })
export class PsgcService {
  private _split(id: string): string[] {
    return String(id).split('|');
  }

  private _regionNode(regionId: string): any {
    return (PSGC_DATA as any)[regionId] || null;
  }

  private _resolve(pathParts: string[]): any {
    const [regionId, ...rest] = pathParts;
    const regionNode = this._regionNode(regionId);
    if (!regionNode) return null;
    if (!rest.length) return regionNode;

    if (regionNode.province_list) {
      const [provinceName, ...rest2] = rest;
      const provinceNode = regionNode.province_list[provinceName];
      if (!provinceNode) return null;
      if (!rest2.length) return provinceNode;
      const [cityName] = rest2;
      return provinceNode.municipality_list?.[cityName] || null;
    }

    const [cityName] = rest;
    return regionNode.municipality_list?.[cityName] || null;
  }

  getRegions(): PsgcNode[] {
    return [
      { psgc_id: 'NCR', name: 'Metro Manila (NCR)' },
      { psgc_id: 'RIZAL', name: 'Rizal Province' }
    ];
  }

  /** regionId e.g. "NCR". Returns [] for regions with no province layer (e.g. Rizal). */
  getProvinces(regionId: string): PsgcNode[] {
    const node = this._regionNode(regionId);
    const list = node?.province_list;
    if (!list) return [];
    return Object.keys(list).map(name => ({ psgc_id: `${regionId}|${name}`, name }));
  }

  /** parentId: a region id (e.g. "RIZAL") or a "region|province" id */
  getCitiesMunicipalities(parentId: string): PsgcNode[] {
    const node = this._resolve(this._split(parentId));
    const list = node?.municipality_list;
    if (!list) return [];
    return Object.keys(list).map(name => ({ psgc_id: `${parentId}|${name}`, name }));
  }

  /** cityId: a "region|city" or "region|province|city" id */
  getBarangays(cityId: string): PsgcNode[] {
    const node = this._resolve(this._split(cityId));
    const list = node?.barangay_list;
    if (!list) return [];
    return list.map((name: string) => ({ psgc_id: `${cityId}|${name}`, name }));
  }

  /** Every supported region maps 1:1 to a single delivery zone — matches server/config.js. */
  zoneIdForRegion(regionCode: string): string {
    return regionCode === 'RIZAL' ? 'rizal' : 'metro-manila';
  }
}
