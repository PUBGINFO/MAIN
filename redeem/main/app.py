import requests
import time
import json
import re
from datetime import datetime
from urllib.parse import urlparse, parse_qs

class PUBGRedeemer:
    def __init__(self):
        self.base_url = "https://na.apps.amsoveasea.com/swoole/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Origin': 'https://www.pubgmobile.com',
            'Referer': 'https://www.pubgmobile.com/',
        })

    def parse_url(self, url: str) -> dict:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        
        result = {
            'roleid': params.get('roleid', [None])[0],
            'sCdk': params.get('sCdk', [None])[0],
            'verifyKey': params.get('verifyKey', [None])[0],
            'full_url': url
        }
        
        # URL ëì½ë© (íìì)
        if result['verifyKey']:
            result['verifyKey'] = result['verifyKey'].replace('%3A', ':')
        
        return result

    def exchange_cdk(self, role_id: str, cdk: str, verify_key: str) -> dict:
        params = {
            'actid': '1692',
            'r': 'ExchangeCdkey/ExchangeCdk',
            'sServiceType': 'pubgmobile',
            'roleid': role_id,
            'sCdk': cdk,
            'verifyKey': verify_key,
            'areaid': '1',
            'platid': '0',
            'partition': '0',
            'responsetype': '1'
        }
        
        try:
            response = self.session.get(self.base_url, params=params, timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f"HTTP {response.status_code}"}
        except Exception as e:
            return {'error': str(e)}

    def get_error_message(self, error_code: int) -> str:
        error_messages = {
            10204: "â êµí ì±ê³µ",
            -10001: "â ì í¨íì§ ìì ì¿ í° ì½ë",
            -10002: "â ì´ë¯¸ ì¬ì©ë ì¿ í°",
            -10003: "â ë§ë£ë ì¿ í°",
            -10004: "â UID ë¶ì¼ì¹",
            -10005: "â ì´ë¯¸ ì¬ì©/ì í¨íì§ ìì ì¿ í°",
            -10006: "â ï¸ ìë² ë´ë¶ ì¤ë¥ (ì¬ìë íì)",
            -10007: "â ì¿ í° êµí íë ì´ê³¼",
            -10008: "â ì¼ì¼ êµí íë ì´ê³¼",
        }
        return error_messages.get(error_code, f"â ì ì ìë ì¤ë¥ (ì½ë: {error_code})")

    def redeem_with_url(self, url: str, target_ids: list = None, max_retries: int = 3) -> dict:
        url_info = self.parse_url(url)
        
        if not url_info['roleid'] or not url_info['sCdk'] or not url_info['verifyKey']:
            return {'error': 'URLìì íì ì ë³´ë¥¼ ì¶ì¶í  ì ììµëë¤.', 'url_info': url_info}
        
        print(f"\nð URLìì ì¶ì¶í ì ë³´:")
        print(f"   - UID: {url_info['roleid']}")
        print(f"   - ì¿ í° ì½ë: {url_info['sCdk']}")
        print(f"   - verifyKey: {url_info['verifyKey']}")
        
        if target_ids is None:
            try:
                with open('id.txt', 'r', encoding='utf-8') as f:
                    target_ids = [line.strip() for line in f if line.strip()]
            except FileNotFoundError:
                return {'error': 'id.txt íì¼ì ì°¾ì ì ììµëë¤.'}
            except Exception as e:
                return {'error': f'id.txt íì¼ ì½ê¸° ì¤ë¥: {str(e)}'}
        
        if not target_ids:
            return {'error': 'ì²ë¦¬í  UIDê° ììµëë¤.'}
        
        print(f"\nð ì´ {len(target_ids)}ê°ì UIDë¥¼ ë°ê²¬íìµëë¤.")
        
        results = {
            'source_url': url,
            'source_info': url_info,
            'success': [],
            'failed': [],
            'total': len(target_ids),
            'timestamp': datetime.now().isoformat()
        }
        
        for i, role_id in enumerate(target_ids, 1):
            print(f"\n{'='*50}")
            print(f"[{i}/{len(target_ids)}] {role_id}", end=" ")
            
            result = self.redeem_single(
                role_id=role_id,
                cdk=url_info['sCdk'],
                verify_key=url_info['verifyKey'],
                max_retries=max_retries
            )
            
            if result['success']:
                results['success'].append(result)
                print("-> ì±ê³µ")
            else:
                results['failed'].append(result)
                print("-> ì¤í¨")
            
            if i < len(target_ids):
                time.sleep(1)
        
        return results

    def redeem_single(self, role_id: str, cdk: str, verify_key: str, max_retries: int = 3) -> dict:
        result = {
            'role_id': role_id,
            'success': False,
            'message': '',
            'raw_response': None,
            'retries': 0
        }
        
        for attempt in range(1, max_retries + 1):
            if attempt > 1:
                wait_time = 2 ** attempt
                print(f"\n   â³ {wait_time}ì´ í ì¬ìë {attempt}/{max_retries}...", end=" ")
                time.sleep(wait_time)
            
            result['retries'] = attempt
            exchange_result = self.exchange_cdk(role_id, cdk, verify_key)
            
            if 'error' in exchange_result:
                if attempt < max_retries:
                    print(f"â ï¸ ì¤ë¥, ì¬ìë ì¤...", end=" ")
                    continue
                result['message'] = f"API ì¤ë¥: {exchange_result['error']}"
                return result
            
            result['raw_response'] = exchange_result
            
            if exchange_result.get('iRet') != 0:
                if attempt < max_retries:
                    print(f"â ï¸ iRet ì¤ë¥, ì¬ìë ì¤...", end=" ")
                    continue
                result['message'] = f"êµí ì¤í¨ (iRet: {exchange_result.get('iRet')})"
                return result
            
            jdata = exchange_result.get('jData', {})
            inner_ret = jdata.get('iRet', -999)
            
            if inner_ret == -10006 and attempt < max_retries:
                print(f"â ï¸ ìë² ì¤ë¥, ì¬ìë ì¤...", end=" ")
                continue
            
            if inner_ret != 0:
                result['message'] = self.get_error_message(inner_ret)
                return result
            
            # ì±ê³µ!
            result['success'] = True
            result['message'] = 'â êµí ì±ê³µ!'
            return result
        
        result['message'] = f"ìµë ì¬ìë íì({max_retries}) ì´ê³¼"
        return result

def main():
    print("=" * 60)
    print("ð® ëª¨ë°° ì¿ í° ë±ë¡ê¸°")
    print("=" * 60)
    
    try:
        with open('v.txt', 'r', encoding='utf-8') as f:
            urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print("â v.txt íì¼ì ì°¾ì ì ììµëë¤.")
        print("ð v.txt íì¼ì ì±ê³µ URLì ë£ì´ì£¼ì¸ì.")
        return
    except Exception as e:
        print(f"â v.txt íì¼ ì½ê¸° ì¤ë¥: {str(e)}")
        return
    
    if not urls:
        print("â v.txt íì¼ì URLì´ ììµëë¤.")
        return
    
    print(f"\nð ì´ {len(urls)}ê°ì URLì ë°ê²¬íìµëë¤.")
    
    redeemer = PUBGRedeemer()
    all_results = []
    
    for idx, url in enumerate(urls, 1):
        print(f"\n{'='*60}")
        print(f"[{idx}/{len(urls)}] URL ì²ë¦¬ ì¤...")
        print(f"ð {url[:100]}..." if len(url) > 100 else f"ð {url}")
        
        # id.txtìì ID ëª©ë¡ ì½ê¸°
        try:
            with open('id.txt', 'r', encoding='utf-8') as f:
                target_ids = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            print("â id.txt íì¼ì ì°¾ì ì ììµëë¤.")
            continue
        except Exception as e:
            print(f"â id.txt íì¼ ì½ê¸° ì¤ë¥: {str(e)}")
            continue
        
        if not target_ids:
            print("â id.txtì UIDê° ììµëë¤.")
            continue
        
        result = redeemer.redeem_with_url(url, target_ids)
        
        if 'error' in result:
            print(f"â ì¤ë¥: {result['error']}")
            continue
        
        all_results.append(result)
        print(f"\nð URL ì²ë¦¬ ê²°ê³¼:")
        print(f"   â ì±ê³µ: {len(result['success'])}ê°")
        print(f"   â ì¤í¨: {len(result['failed'])}ê°")
    
    print("\n" + "=" * 60)
    print("â ëª¨ë  ììì´ ìë£ëììµëë¤!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nâ ï¸ ì¬ì©ìì ìí´ ì¤ë¨ëììµëë¤.")
    except Exception as e:
        print(f"\nâ ììì¹ ëª»í ì¤ë¥ ë°ì: {str(e)}")
