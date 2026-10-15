import pathlib
import subprocess
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]

def main():
    subprocess.run(['node','tests/run.js'],cwd=ROOT,check=True)
    subprocess.run(['node','scripts/build.js'],cwd=ROOT,check=True)
    dist=ROOT/'dist'
    files=list((dist/'Scriptable').rglob('*'))+[dist/'iPhone安装说明.md',dist/'隐私说明.md']
    with zipfile.ZipFile(dist/'麦麦日历-iPhone安装包.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for p in files:
            if p.is_file():archive.write(p,p.relative_to(dist))
    allowed={'src','assets','data','web','scripts','tests','docs','design-prompts','.github'}
    root_files={'README.md','MCP_INTEGRATION.md','CONTEST_DECLARATION.md','mcp-config.example.json','package.json','LICENSE','.gitignore','.env.example'}
    with zipfile.ZipFile(dist/'maimai-calendar-source.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for p in sorted(ROOT.rglob('*')):
            if not p.is_file():continue
            rel=p.relative_to(ROOT)
            if '__pycache__' in rel.parts or p.suffix=='.pyc':continue
            if (len(rel.parts)==1 and rel.name in root_files) or rel.parts[0] in allowed:
                archive.write(p,rel)
    print('Created installation and source ZIPs. Private data excluded by allowlist.')

if __name__=='__main__':main()
