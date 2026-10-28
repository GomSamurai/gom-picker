using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace GomColorPicker
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
                Directory.SetCurrentDirectory(appDir);

                int port = 5050;
                bool isServerListening = IsPortOpen("127.0.0.1", port);

                if (!isServerListening)
                {
                    string serverScript = Path.Combine(appDir, "local-server.js");
                    if (File.Exists(serverScript))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = "node";
                        psi.Arguments = "\"" + serverScript + "\"";
                        psi.WorkingDirectory = appDir;
                        psi.WindowStyle = ProcessWindowStyle.Hidden;
                        psi.CreateNoWindow = true;
                        psi.UseShellExecute = false;

                        try
                        {
                            Process.Start(psi);
                            for (int i = 0; i < 20; i++)
                            {
                                Thread.Sleep(100);
                                if (IsPortOpen("127.0.0.1", port))
                                {
                                    isServerListening = true;
                                    break;
                                }
                            }
                        }
                        catch
                        {
                            // Node executable not in PATH or failed to start
                        }
                    }
                }

                if (isServerListening)
                {
                    Process.Start(new ProcessStartInfo("http://localhost:5050/") { UseShellExecute = true });
                }
                else
                {
                    string htmlPath = Path.Combine(appDir, "index.html");
                    if (File.Exists(htmlPath))
                    {
                        Process.Start(new ProcessStartInfo(htmlPath) { UseShellExecute = true });
                    }
                    else
                    {
                        MessageBox.Show("No se encontró index.html en: " + appDir,
                            "GOM Color Picker Pro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error iniciando GOM Color Picker Pro: " + ex.Message,
                    "GOM Color Picker Pro", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        static bool IsPortOpen(string host, int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(250);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
