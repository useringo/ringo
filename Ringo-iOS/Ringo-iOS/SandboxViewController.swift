//
//  SandboxViewController.swift
//  Ringo-iOS
//
//  Created by Gautam Mittal on 5/23/15.
//  Copyright (c) 2015 Gautam Mittal. All rights reserved.
//

import UIKit

class SandboxViewController: UIViewController {
    
let screenSize: CGRect = UIScreen.mainScreen().bounds
    
    @IBOutlet weak var codeTextIO: UITextView!
    
    @IBOutlet weak var outputIO: UITextView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
//        print(screenSize.height);

        
       
        
    }
    
    

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()

    }
    
    


    @IBAction func executeCode(sender: AnyObject) {
  
        
        print("Executing code...");
        
        resignFirstResponder();
        self.view.endEditing(true);
        
        
        outputIO.text = "Compiling...";
        
        var code = codeTextIO.text;
        
        
        
        let request = NSMutableURLRequest(URL: NSURL(string: "http://4e2a4c9c.ngrok.io/build")!)
        request.HTTPMethod = "POST"
        let postString = "code=" + code;
        request.HTTPBody = postString.dataUsingEncoding(NSUTF8StringEncoding)
        let task = NSURLSession.sharedSession().dataTaskWithRequest(request) {
            data, response, error in
            
            if error != nil {
                print("error=\(error)");
                
                self.outputIO.text = "An error occurred. Please check your device's internet connection.";
                
                return
            }
            
            print("response = \(response)")
            
            let responseString = NSString(data: data!, encoding: NSUTF8StringEncoding)
            print(responseString);
            
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
               self.outputIO.text = String(responseString!);
                
            
                
            })
            
        }
        
        task!.resume()
        

    }
    
    }
