//
//  SandboxViewController.swift
//  Ringo-iOS
//
//  Created by Gautam Mittal on 5/23/15.
//  Copyright (c) 2015 Gautam Mittal. All rights reserved.
//

import UIKit

class SandboxViewController: UIViewController {
    

    
    @IBOutlet weak var codeTextIO: UITextView!
    
    @IBOutlet weak var outputIO: UITextView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
       
        
    }
    
    

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()

    }
    
    


    @IBAction func executeCode(sender: AnyObject) {
  
        
        println("Executing code...");
        
        resignFirstResponder();
        self.view.endEditing(true);
        
        
        outputIO.text = "Compiling...";
        
        var code = codeTextIO.text;
        
        
        
        let request = NSMutableURLRequest(URL: NSURL(string: "http://gautam-mittal-wwdc.ngrok.com/build")!)
        request.HTTPMethod = "POST"
        let postString = "code=" + code;
        request.HTTPBody = postString.dataUsingEncoding(NSUTF8StringEncoding)
        let task = NSURLSession.sharedSession().dataTaskWithRequest(request) {
            data, response, error in
            
            if error != nil {
                println("error=\(error)");
                
                self.outputIO.text = "An error occurred. Please check your device's internet connection.";
                
                return
            }
            
            println("response = \(response)")
            
            let responseString = NSString(data: data, encoding: NSUTF8StringEncoding)
            println(responseString);
            
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
               self.outputIO.text = String(responseString!);
                
            
                
            })
            
        }
        
        task.resume()
        

    }
    
    }
